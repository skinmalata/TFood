import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { triggerAdminEvent } from '../services/pusher';

export const getVendorProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    const menuItems = await db('menu_items').where({ vendor_id: vendor.id });
    const documents = await db('vendor_documents').where({ vendor_id: vendor.id });
    const recentOrders = await db('orders')
      .where({ vendor_id: vendor.id })
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({
      success: true, data: {
        ...vendor, menuItems, documents,
        recentOrders,
      },
    });
  } catch (err) { next(err); }
};

export const updateVendorProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    const allowedFields = [
      'businessName', 'businessAddress', 'cuisineType', 'description',
      'deliveryRadius', 'preparationTime', 'openingHours', 'closingHours',
      'logoUrl', 'coverImageUrl', 'bankAccountName', 'bankName', 'bankAccountNumber',
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      const snakeField = field.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
      if (req.body[field] !== undefined) updates[snakeField] = req.body[field];
    }

    if (Object.keys(updates).length > 0) {
      await db('vendors').where({ id: vendor.id }).update(updates);
    }

    res.json({ success: true, message: 'Vendor profile updated' });
  } catch (err) { next(err); }
};

export const toggleOpen = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);
    await db('vendors').where({ id: vendor.id }).update({ is_open: !vendor.is_open });
    res.json({ success: true, message: `Shop is now ${vendor.is_open ? 'closed' : 'open'}`, data: { isOpen: !vendor.is_open } });
  } catch (err) { next(err); }
};

export const getVendorPublicProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const vendor = await db('vendors')
      .join('users', 'vendors.user_id', 'users.id')
      .where('vendors.id', id)
      .where('vendors.status', 'approved')
      .select('vendors.*', 'users.first_name', 'users.last_name', 'users.avatar_url')
      .first();

    if (!vendor) throw new AppError('Vendor not found', 404);

    const menuItems = await db('menu_items').where({ vendor_id: id, is_available: true });
    const reviews = await db('reviews').where({ vendor_id: id }).orderBy('created_at', 'desc').limit(20);

    res.json({ success: true, data: { ...vendor, menuItems, reviews } });
  } catch (err) { next(err); }
};

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);
    if (!req.file) throw new AppError('Document file is required', 400);

    const { type } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    await db('vendor_documents').insert({ vendor_id: vendor.id, type, file_url: fileUrl });

    // Notify admin
    await triggerAdminEvent('document-uploaded', {
      vendorId: vendor.id,
      businessName: vendor.business_name,
      documentType: type,
    });

    res.status(201).json({ success: true, message: 'Document uploaded for verification' });
  } catch (err) { next(err); }
};

export const getVendorOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('orders').where({ vendor_id: vendor.id });
    if (status) query = query.where({ status: status as string });

    const [{ count }] = await query.clone().count('* as count');
    const orders = await query.clone().orderBy('created_at', 'desc').offset(offset).limit(Number(limit));

    res.json({
      success: true,
      data: orders,
      pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(Number(count) / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    const today = new Date().toISOString().split('T')[0];
    const [totalOrders] = await db('orders').where({ vendor_id: vendor.id }).count('* as count');
    const [todayOrders] = await db('orders').where({ vendor_id: vendor.id }).whereRaw('DATE(created_at) = ?', [today]).count('* as count');
    const [pendingOrders] = await db('orders').where({ vendor_id: vendor.id, status: 'pending' }).count('* as count');
    const [totalRevenue] = await db('orders').where({ vendor_id: vendor.id, payment_status: 'success' }).sum('total_amount as total');
    const [todayRevenue] = await db('orders').where({ vendor_id: vendor.id, payment_status: 'success' }).whereRaw('DATE(created_at) = ?', [today]).sum('total_amount as total');

    res.json({
      success: true, data: {
        totalOrders: totalOrders.count,
        todayOrders: todayOrders.count,
        pendingOrders: pendingOrders.count,
        totalRevenue: totalRevenue.total || 0,
        todayRevenue: todayRevenue.total || 0,
      },
    });
  } catch (err) { next(err); }
};
