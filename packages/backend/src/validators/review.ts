import Joi from 'joi';

export const createReviewSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(2000).allow('').optional(),
});

export const createDisputeSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  reason: Joi.string().max(255).required(),
  description: Joi.string().max(5000).required(),
});
