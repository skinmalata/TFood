import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as pusherService from '../services/pusher';

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, content, messageType } = req.body;
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) throw new AppError('Order not found', 404);

    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    const isConsumer = order.consumer_id === req.user!.id;
    const isVendor = vendor && order.vendor_id === vendor.id;

    if (!isConsumer && !isVendor && req.user!.role !== 'admin') {
      throw new AppError('Unauthorized to send messages in this order', 403);
    }

    const messageData: any = {
      order_id: orderId,
      sender_id: req.user!.id,
      sender_role: req.user!.role,
      message_type: messageType || 'text',
      content: content || '',
    };

    if (req.file) {
      if (req.file.mimetype.startsWith('audio/')) {
        messageData.message_type = 'voice';
        messageData.voice_url = `/uploads/${req.file.filename}`;
      } else {
        messageData.message_type = 'image';
        messageData.image_url = `/uploads/${req.file.filename}`;
      }
    }

    if (messageData.message_type === 'text' && !content) {
      throw new AppError('Message content is required for text messages', 400);
    }

    const [messageId] = await db('chat_messages').insert(messageData);
    const message = await db('chat_messages').where({ id: messageId }).first();

    // Real-time: send to both parties
    const chatChannel = `chat-${orderId}`;
    try {
      await pusherService.triggerChatEvent(orderId, 'new-message', message);
    } catch { }

    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) throw new AppError('Order not found', 404);

    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    const isConsumer = order.consumer_id === req.user!.id;
    const isVendor = vendor && order.vendor_id === vendor.id;

    if (!isConsumer && !isVendor && req.user!.role !== 'admin') {
      throw new AppError('Unauthorized', 403);
    }

    const messages = await db('chat_messages')
      .where({ order_id: orderId })
      .orderBy('created_at', 'asc');

    // Mark messages as read
    await db('chat_messages')
      .where({ order_id: orderId, is_read: false })
      .where('sender_id', '!=', req.user!.id)
      .update({ is_read: true, read_at: new Date() });

    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    await db('chat_messages')
      .where({ order_id: orderId, is_read: false })
      .where('sender_id', '!=', req.user!.id)
      .update({ is_read: true, read_at: new Date() });

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) { next(err); }
};

export const initiateCall = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, receiverId } = req.body;
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) throw new AppError('Order not found', 404);

    const caller = await db('users').where({ id: req.user!.id }).first();
    const receiver = await db('users').where({ id: receiverId }).first();
    if (!receiver) throw new AppError('Receiver not found', 404);

    // Record call initiation
    const [callId] = await db('voice_calls').insert({
      order_id: orderId,
      caller_id: req.user!.id,
      receiver_id: receiverId,
      call_sid: `pending-${Date.now()}`,
      status: 'initiated',
    });

    // Notify receiver via Pusher
    await pusherService.triggerConsumerEvent(receiverId, 'incoming-call', {
      callId,
      orderId,
      caller: { id: caller.id, name: `${caller.first_name} ${caller.last_name}` },
    });

    res.status(201).json({
      success: true,
      message: 'Call initiated',
      data: { callId, callSid: `pending-${Date.now()}` },
    });
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();

    let query = db('chat_messages')
      .join('orders', 'chat_messages.order_id', 'orders.id')
      .where('chat_messages.sender_id', '!=', req.user!.id)
      .where('chat_messages.is_read', false);

    if (req.user!.role === 'vendor' && vendor) {
      query = query.where('orders.vendor_id', vendor.id);
    } else if (req.user!.role === 'consumer') {
      query = query.where('orders.consumer_id', req.user!.id);
    }

    const [{ count }] = await query.count('* as count');
    res.json({ success: true, data: { unreadCount: count } });
  } catch (err) { next(err); }
};
