import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as paystackService from '../services/paystack';

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reference } = req.params;
    const payment = await paystackService.verifyPayment(reference);

    if (payment.status === 'success') {
      await db('payment_transactions').where({ reference }).update({
        status: 'success',
        gateway_response: JSON.stringify(payment),
        paid_at: new Date(),
      });

      const transaction = await db('payment_transactions').where({ reference }).first();
      if (transaction) {
        await db('orders').where({ id: transaction.order_id }).update({ payment_status: 'success' });
      }
    }

    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
};

export const paystackWebhook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = req.body;
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const transaction = await db('payment_transactions').where({ reference }).first();

      if (transaction) {
        await db('payment_transactions').where({ reference }).update({
          status: 'success',
          gateway_response: JSON.stringify(event.data),
          paid_at: new Date(),
        });
        await db('orders').where({ id: transaction.order_id }).update({ payment_status: 'success' });

        // Auto-save card if requested
        if (event.data.authorization && event.data.authorization.reusable) {
          const existingCard = await db('saved_cards')
            .where({ user_id: transaction.user_id, authorization_code: event.data.authorization.authorization_code })
            .first();
          if (!existingCard) {
            await db('saved_cards').insert({
              user_id: transaction.user_id,
              authorization_code: event.data.authorization.authorization_code,
              last4: event.data.authorization.last4,
              brand: event.data.authorization.brand,
              exp_month: event.data.authorization.exp_month,
              exp_year: event.data.authorization.exp_year,
            });
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (err) { next(err); }
};

export const chargeCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, cardId } = req.body;
    const order = await db('orders').where({ id: orderId, consumer_id: req.user!.id }).first();
    if (!order) throw new AppError('Order not found', 404);

    const card = await db('saved_cards').where({ id: cardId, user_id: req.user!.id }).first();
    if (!card) throw new AppError('Card not found', 403);

    const user = await db('users').where({ id: req.user!.id }).first();
    const payment = await paystackService.chargeAuthorization(
      card.authorization_code,
      user.email,
      order.total_amount
    );

    if (payment.status === 'success') {
      await db('orders').where({ id: orderId }).update({ payment_status: 'success' });
      await db('payment_transactions').insert({
        order_id: orderId,
        user_id: req.user!.id,
        reference: payment.reference,
        amount: order.total_amount,
        currency: 'NGN',
        status: 'success',
        gateway: 'paystack',
        gateway_response: JSON.stringify(payment),
        paid_at: new Date(),
      });
    }

    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await db('payment_transactions')
      .where({ user_id: req.user!.id })
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};
