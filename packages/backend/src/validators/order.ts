import Joi from 'joi';

export const createOrderSchema = Joi.object({
  vendorId: Joi.number().integer().positive().required(),
  items: Joi.array().items(Joi.object({
    menuItemId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).max(50).required(),
    specialInstructions: Joi.string().max(500).allow('').optional(),
  })).min(1).required(),
  deliveryMethod: Joi.string().valid('pickup', 'delivery').required(),
  deliveryAddress: Joi.string().when('deliveryMethod', { is: 'delivery', then: Joi.required() }),
  deliveryLatitude: Joi.number().min(-90).max(90).optional(),
  deliveryLongitude: Joi.number().min(-180).max(180).optional(),
  notes: Joi.string().max(1000).allow('').optional(),
  paymentReference: Joi.string().optional(),
  saveCard: Joi.boolean().default(false),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid(
    'accepted', 'declined', 'preparing', 'ready',
    'out_for_delivery', 'delivered', 'cancelled'
  ).required(),
});
