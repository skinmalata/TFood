import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, rating, comment } = req.body;
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) throw new AppError('Order not found', 404);

    if (order.consumer_id !== req.user!.id) {
      throw new AppError('Only the consumer can review this order', 403);
    }

    if (order.status !== 'delivered') {
      throw new AppError('Can only review delivered orders', 400);
    }

    const existing = await db('reviews').where({ order_id: orderId }).first();
    if (existing) throw new AppError('Order already reviewed', 409);

    const [id] = await db('reviews').insert({
      order_id: orderId,
      consumer_id: req.user!.id,
      vendor_id: order.vendor_id,
      rating,
      comment,
    });

    // Update vendor average rating
    const [avg] = await db('reviews').where({ vendor_id: order.vendor_id }).avg('rating as avg');
    await db('vendors').where({ id: order.vendor_id }).update({
      rating: Math.round((avg.avg || 0) * 10) / 10,
    });

    const review = await db('reviews').where({ id }).first();
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

export const createDispute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, reason, description } = req.body;
    const order = await db('orders').where({ id: orderId }).first();
    if (!order) throw new AppError('Order not found', 404);

    const isConsumer = order.consumer_id === req.user!.id;
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    const isVendor = vendor && order.vendor_id === vendor.id;

    if (!isConsumer && !isVendor) {
      throw new AppError('Unauthorized to dispute this order', 403);
    }

    const existing = await db('disputes').where({ order_id: orderId, status: ['open', 'under_review'] }).first();
    if (existing) throw new AppError('An active dispute already exists for this order', 409);

    const [id] = await db('disputes').insert({
      order_id: orderId,
      raised_by: req.user!.id,
      raised_by_role: req.user!.role === 'vendor' ? 'vendor' : 'consumer',
      reason,
      description,
    });

    const dispute = await db('disputes').where({ id }).first();

    // Notify admin
    try {
      const { triggerAdminEvent } = require('../services/pusher');
      await triggerAdminEvent('new-dispute', {
        disputeId: id,
        orderId,
        raisedBy: req.user!.role,
      });
    } catch { }

    res.status(201).json({ success: true, data: dispute });
  } catch (err) { next(err); }
};

export const getVendorReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.params.vendorId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [{ count }] = await db('reviews').where({ vendor_id: vendorId }).count('* as count');
    const reviews = await db('reviews')
      .where({ vendor_id: vendorId })
      .join('users', 'reviews.consumer_id', 'users.id')
      .select('reviews.*', 'users.first_name', 'users.last_name', 'users.avatar_url')
      .orderBy('reviews.created_at', 'desc')
      .offset(offset).limit(Number(limit));

    res.json({
      success: true, data: reviews,
      pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(Number(count) / Number(limit)) },
    });
  } catch (err) { next(err); }
};
