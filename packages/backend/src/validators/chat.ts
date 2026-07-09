import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  content: Joi.string().max(2000).when('messageType', {
    is: 'text',
    then: Joi.required(),
    otherwise: Joi.allow('').optional(),
  }),
  messageType: Joi.string().valid('text', 'voice', 'image').default('text'),
});

export const initiateCallSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  receiverId: Joi.number().integer().positive().required(),
});
