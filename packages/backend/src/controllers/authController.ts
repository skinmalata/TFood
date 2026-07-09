import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { config } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as paystackService from '../services/paystack';

const generateToken = (user: { id: number; email: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as any }
  );
};

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password, firstName, lastName, role, businessName, businessAddress, latitude, longitude, cuisineType } = req.body;

    const existing = await db('users').where({ email }).orWhere({ phone }).first();
    if (existing) {
      throw new AppError('Email or phone already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [userId] = await db('users').insert({
      email, phone, password_hash: passwordHash,
      first_name: firstName, last_name: lastName,
      role, is_active: true,
    });

    if (role === 'vendor') {
      await db('vendors').insert({
        user_id: userId,
        business_name: businessName,
        business_address: businessAddress,
        latitude, longitude,
        cuisine_type: cuisineType,
        status: 'pending',
      });
    } else {
      await db('consumers').insert({ user_id: userId });
    }

    const user = await db('users').where({ id: userId }).first();
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name } },
    });
  } catch (err) { next(err); }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await db('users').where({ email }).first();
    if (!user) throw new AppError('Invalid email or password', 401);

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new AppError('Invalid email or password', 401);

    if (!user.is_active) throw new AppError('Account is deactivated. Contact support.', 403);

    const token = generateToken(user);
    let profile = null;

    if (user.role === 'vendor') {
      profile = await db('vendors').where({ user_id: user.id }).first();
    } else if (user.role === 'consumer') {
      profile = await db('consumers').where({ user_id: user.id }).first();
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name, phone: user.phone, avatarUrl: user.avatar_url, profile } },
    });
  } catch (err) { next(err); }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await db('users').where({ id: req.user!.id }).first();
    if (!user) throw new AppError('User not found', 404);

    let profile = null;
    if (user.role === 'vendor') {
      profile = await db('vendors').where({ user_id: user.id }).first();
      profile.menuItems = await db('menu_items').where({ vendor_id: profile.id });
      profile.documents = await db('vendor_documents').where({ vendor_id: profile.id });
    } else if (user.role === 'consumer') {
      profile = await db('consumers').where({ user_id: user.id }).first();
      profile.savedCards = await db('saved_cards').where({ user_id: user.id });
    }

    res.json({ success: true, data: { ...user, password_hash: undefined, profile } });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, avatarUrl, defaultAddress, latitude, longitude } = req.body;
    const updates: any = {};
    if (firstName) updates.first_name = firstName;
    if (lastName) updates.last_name = lastName;
    if (phone) updates.phone = phone;
    if (avatarUrl) updates.avatar_url = avatarUrl;

    if (Object.keys(updates).length > 0) {
      await db('users').where({ id: req.user!.id }).update(updates);
    }

    if (req.user!.role === 'consumer' && (defaultAddress !== undefined || latitude !== undefined || longitude !== undefined)) {
      const consumerUpdates: any = {};
      if (defaultAddress !== undefined) consumerUpdates.default_address = defaultAddress;
      if (latitude !== undefined) consumerUpdates.latitude = latitude;
      if (longitude !== undefined) consumerUpdates.longitude = longitude;
      if (Object.keys(consumerUpdates).length > 0) {
        await db('consumers').where({ user_id: req.user!.id }).update(consumerUpdates);
      }
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) { next(err); }
};

export const initPasswordReset = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await db('users').where({ email }).first();
    if (!user) throw new AppError('User not found', 404);

    const resetToken = uuidv4();
    await db('users').where({ id: user.id }).update({ password_reset_token: resetToken });

    // TODO: Send email with reset link
    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (err) { next(err); }
};

export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await db('users').where({ id: req.user!.id }).first();
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new AppError('Current password is incorrect', 401);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db('users').where({ id: req.user!.id }).update({ password_hash: passwordHash });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { next(err); }
};

export const saveCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { authorizationCode, last4, brand, expMonth, expYear } = req.body;
    await db('saved_cards').insert({
      user_id: req.user!.id,
      authorization_code: authorizationCode,
      last4, brand, exp_month: expMonth, exp_year: expYear,
    });
    res.status(201).json({ success: true, message: 'Card saved successfully' });
  } catch (err) { next(err); }
};
