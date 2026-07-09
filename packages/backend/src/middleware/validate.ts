import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
  };
};
