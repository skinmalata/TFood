import Joi from 'joi';

export const createMenuItemSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(2000).allow('').optional(),
  price: Joi.number().positive().precision(2).required(),
  currency: Joi.string().length(3).default('NGN'),
  category: Joi.string().max(100).required(),
  isAvailable: Joi.boolean().default(true),
  isPopular: Joi.boolean().default(false),
  preparationTime: Joi.number().integer().positive().optional(),
});

export const updateMenuItemSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(2000).allow('').optional(),
  price: Joi.number().positive().precision(2).optional(),
  currency: Joi.string().length(3).optional(),
  category: Joi.string().max(100).optional(),
  isAvailable: Joi.boolean().optional(),
  isPopular: Joi.boolean().optional(),
  preparationTime: Joi.number().integer().positive().optional(),
});
