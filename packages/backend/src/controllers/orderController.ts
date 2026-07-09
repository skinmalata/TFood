import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as pusherService from '../services/pusher';
import * as paystackService from '../services/paystack';
import * as mapsService from '../services/maps';
import { v4 as uuidv4 } from 'uuid';

const generateOrderNumber = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TF-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { vendorId, items, deliveryMethod, deliveryAddress, deliveryLatitude, deliveryLongitude, notes, paymentReference, saveCard } = req.body;

    const vendor = await db('vendors').where({ id: vendorId, status: 'approved' }).first();
    if (!vendor) throw new AppError('Vendor not found or not approved', 404);
    if (!vendor.is_open) throw new AppError('Vendor is currently closed', 400);

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const menuItem = await db('menu_items').where({ id: item.menuItemId, vendor_id: vendorId, is_available: true }).first();
      if (!menuItem) throw new AppError(`Menu item ${item.menuItemId} not found or unavailable`, 404);

      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;
      orderItems.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        unit_price: menuItem.price,
        subtotal,
        special_instructions: item.specialInstructions || null,
      });
    }

    // Calculate delivery fee if applicable
    let deliveryFee = 0;
    if (deliveryMethod === 'delivery') {
      const consumer = await db('consumers').where({ user_id: req.user!.id }).first();
      const cLat = deliveryLatitude || consumer?.latitude;
      const cLng = deliveryLongitude || consumer?.longitude;
      if (!cLat || !cLng) throw new AppError('Delivery address location is required', 400);

      const estimate = await mapsService.getDeliveryEstimate(
        vendor.latitude, vendor.longitude,
        cLat, cLng,
        vendor.preparation_time,
        vendor.delivery_radius
      );
      deliveryFee = estimate.deliveryFee;
    }

    totalAmount += deliveryFee;
    const orderNumber = generateOrderNumber();

    // Initialize payment
    const reference = paymentReference || `TF-${uuidv4().slice(0, 12).toUpperCase()}`;
    const consumer = await db('users').where({ id: req.user!.id }).first();
    let paymentUrl = null;

    if (!paymentReference) {
      const payment = await paystackService.initializePayment(
        consumer.email,
        totalAmount,
        reference,
        { orderNumber, vendorId, consumerId: req.user!.id }
      );
      paymentUrl = payment.authorization_url;
    }

    // Create order
    const [orderId] = await db('orders').insert({
      order_number: orderNumber,
      consumer_id: req.user!.id,
      vendor_id: vendorId,
      total_amount: totalAmount,
      delivery_fee: deliveryFee,
      status: 'pending',
      payment_status: paymentReference ? 'success' : 'pending',
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress,
      delivery_latitude: deliveryLatitude,
      delivery_longitude: deliveryLongitude,
      notes,
    });

    // Insert order items
    for (const oi of orderItems) {
      await db('order_items').insert({ order_id: orderId, ...oi });
    }

    // Record payment transaction
    await db('payment_transactions').insert({
      order_id: orderId,
      user_id: req.user!.id,
      reference,
      amount: totalAmount,
      currency: 'NGN',
      status: paymentReference ? 'success' : 'pending',
      gateway: 'paystack',
    });

    // Save card if requested
    if (saveCard && paymentReference) {
      // TODO: Save card from the successful payment
    }

    // Trigger real-time event to vendor
    const fullOrder = await db('orders').where({ id: orderId }).first();
    fullOrder.items = orderItems;
    try {
      await pusherService.triggerOrderEvent(vendorId, 'new-order', fullOrder);
    } catch { }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order: fullOrder, paymentUrl, reference },
    });
  } catch (err) { next(err); }
};

export const handleOrderAction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await db('orders').where({ id }).first();
    if (!order) throw new AppError('Order not found', 404);

    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor || order.vendor_id !== vendor.id) {
      throw new AppError('Unauthorized to manage this order', 403);
    }

    const validTransitions: Record<string, string[]> = {
      pending: ['accepted', 'declined'],
      accepted: ['preparing'],
      preparing: ['ready'],
      ready: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      pending: ['cancelled'],
      accepted: ['cancelled'],
    };

    const allowedTransitions = validTransitions[order.status] || [];
    if (!allowedTransitions.includes(status)) {
      throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
    }

    const updates: any = { status };
    if (status === 'accepted') {
      updates.accepted_by = req.user!.id;
      updates.accepted_at = new Date();
    }
    if (status === 'delivered') {
      updates.actual_delivery_time = new Date();
    }

    await db('orders').where({ id }).update(updates);
    const updatedOrder = await db('orders').where({ id }).first();

    // Notify consumer in real-time
    try {
      await pusherService.triggerConsumerEvent(order.consumer_id, 'order-update', updatedOrder);
    } catch { }

    res.json({ success: true, message: `Order ${status}`, data: updatedOrder });
  } catch (err) { next(err); }
};

export const getConsumerOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('orders').where({ consumer_id: req.user!.id });
    if (status) query = query.where({ status: status as string });

    const [{ count }] = await query.clone().count('* as count');
    const orders = await query.clone()
      .join('vendors', 'orders.vendor_id', 'vendors.id')
      .select('orders.*', 'vendors.business_name', 'vendors.business_address', 'vendors.logo_url')
      .orderBy('orders.created_at', 'desc')
      .offset(offset).limit(Number(limit));

    res.json({
      success: true, data: orders,
      pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(count / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const getOrderDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await db('orders').where({ id }).first();
    if (!order) throw new AppError('Order not found', 404);

    if (order.consumer_id !== req.user!.id && order.vendor_id !== (await db('vendors').where({ user_id: req.user!.id }).first())?.id && req.user!.role !== 'admin') {
      throw new AppError('Unauthorized', 403);
    }

    const items = await db('order_items').where({ order_id: id });
    const vendor = await db('vendors').where({ id: order.vendor_id }).first();
    const payment = await db('payment_transactions').where({ order_id: id }).first();
    const reviews = await db('reviews').where({ order_id: id }).first();
    const disputes = await db('disputes').where({ order_id: id }).first();

    res.json({ success: true, data: { ...order, items, vendor, payment, reviews, disputes } });
  } catch (err) { next(err); }
};

export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await db('orders').where({ id }).first();
    if (!order) throw new AppError('Order not found', 404);

    if (order.consumer_id !== req.user!.id) {
      throw new AppError('Unauthorized', 403);
    }

    if (!['pending'].includes(order.status)) {
      throw new AppError('Order can only be cancelled while pending', 400);
    }

    await db('orders').where({ id }).update({ status: 'cancelled' });

    try {
      await pusherService.triggerOrderEvent(order.vendor_id, 'order-cancelled', { orderId: id });
    } catch { }

    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) { next(err); }
};
