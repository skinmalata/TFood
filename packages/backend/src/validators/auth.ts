import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s-]{7,15}$/).required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('consumer', 'vendor').required(),
  // Vendor-specific fields
  businessName: Joi.string().min(2).max(255).when('role', { is: 'vendor', then: Joi.required() }),
  businessAddress: Joi.string().when('role', { is: 'vendor', then: Joi.required() }),
  latitude: Joi.number().min(-90).max(90).when('role', { is: 'vendor', then: Joi.required() }),
  longitude: Joi.number().min(-180).max(180).when('role', { is: 'vendor', then: Joi.required() }),
  cuisineType: Joi.string().when('role', { is: 'vendor', then: Joi.required() }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});
