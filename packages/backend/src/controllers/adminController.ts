import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as pusherService from '../services/pusher';

// --- Vendor Management ---
export const listVendors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('vendors').join('users', 'vendors.user_id', 'users.id')
      .select('vendors.*', 'users.first_name', 'users.last_name', 'users.email', 'users.phone', 'users.created_at as registered_at');

    if (status) query = query.where('vendors.status', status as string);

    const [{ count }] = await query.clone().count('* as count');
    const vendors = await query.clone().orderBy('vendors.created_at', 'desc').offset(offset).limit(Number(limit));

    res.json({
      success: true, data: vendors,
      pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(Number(count) / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const updateVendorStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'vetting', 'approved', 'rejected', 'suspended'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const vendor = await db('vendors').where({ id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    await db('vendors').where({ id }).update({ status });
    await db('admin_logs').insert({
      admin_id: req.user!.id,
      action: `vendor_${status}`,
      entity_type: 'vendor',
      entity_id: Number(id),
      details: JSON.stringify({ previousStatus: vendor.status, newStatus: status, notes }),
    });

    // Notify vendor
    try {
      await pusherService.triggerConsumerEvent(vendor.user_id, 'vendor-status-update', { status, notes });
    } catch { }

    res.json({ success: true, message: `Vendor status updated to ${status}` });
  } catch (err) { next(err); }
};

export const getVendorDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const documents = await db('vendor_documents').where({ vendor_id: id });
    res.json({ success: true, data: documents });
  } catch (err) { next(err); }
};

export const verifyDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doc = await db('vendor_documents').where({ id }).first();
    if (!doc) throw new AppError('Document not found', 404);

    await db('vendor_documents').where({ id }).update({
      verified_at: new Date(),
      verified_by: req.user!.id,
    });

    res.json({ success: true, message: 'Document verified' });
  } catch (err) { next(err); }
};

// --- Dispute Management ---
export const listDisputes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('disputes')
      .join('orders', 'disputes.order_id', 'orders.id')
      .join('users as raiser', 'disputes.raised_by', 'raiser.id')
      .select('disputes.*', 'orders.order_number', 'raiser.first_name', 'raiser.last_name', 'raiser.email');

    if (status) query = query.where('disputes.status', status as string);

    const [{ count }] = await query.clone().count('* as count');
    const disputes = await query.clone().orderBy('disputes.created_at', 'desc').offset(offset).limit(Number(limit));

    res.json({
      success: true, data: disputes,
      pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(Number(count) / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const resolveDispute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const dispute = await db('disputes').where({ id }).first();
    if (!dispute) throw new AppError('Dispute not found', 404);

    await db('disputes').where({ id }).update({
      status: status || 'resolved',
      admin_notes: adminNotes,
      resolved_by: req.user!.id,
      resolved_at: new Date(),
    });

    await db('admin_logs').insert({
      admin_id: req.user!.id,
      action: `dispute_${status || 'resolved'}`,
      entity_type: 'dispute',
      entity_id: Number(id),
      details: JSON.stringify({ adminNotes }),
    });

    res.json({ success: true, message: 'Dispute resolved' });
  } catch (err) { next(err); }
};

// --- Analytics ---
export const getAdminDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalUsers] = await db('users').count('* as count');
    const [totalVendors] = await db('vendors').count('* as count');
    const [pendingVendors] = await db('vendors').where({ status: 'pending' }).count('* as count');
    const [activeOrders] = await db('orders').whereNotIn('status', ['delivered', 'cancelled', 'declined']).count('* as count');
    const [totalRevenue] = await db('payment_transactions').where({ status: 'success' }).sum('amount as total');
    const [openDisputes] = await db('disputes').where('status', '!=', 'resolved').where('status', '!=', 'dismissed').count('* as count');

    // Revenue chart (last 7 days)
    const dailyRevenue = await db('payment_transactions')
      .where('status', 'success')
      .where('paid_at', '>=', db.raw("NOW() - INTERVAL '7 days'"))
      .select(db.raw('DATE(paid_at) as date'), db.raw('SUM(amount) as revenue'))
      .groupBy('date')
      .orderBy('date');

    res.json({
      success: true, data: {
        totalUsers: totalUsers.count,
        totalVendors: totalVendors.count,
        pendingVendors: pendingVendors.count,
        activeOrders: activeOrders.count,
        totalRevenue: totalRevenue.total || 0,
        openDisputes: openDisputes.count,
        dailyRevenue,
      },
    });
  } catch (err) { next(err); }
};

export const getAdminLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await db('admin_logs')
      .join('users', 'admin_logs.admin_id', 'users.id')
      .select('admin_logs.*', 'users.first_name', 'users.last_name')
      .orderBy('admin_logs.created_at', 'desc')
      .limit(100);

    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};

export const getAdminUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('users');
    if (role) query = query.where({ role: role as string });

    const [{ count }] = await query.clone().count('* as count');
    const users = await query.clone().select('id', 'email', 'phone', 'first_name', 'last_name', 'role', 'is_active', 'created_at')
      .orderBy('created_at', 'desc').offset(offset).limit(Number(limit));

    res.json({
      success: true, data: users,
      pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(Number(count) / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id }).first();
    if (!user) throw new AppError('User not found', 404);

    await db('users').where({ id }).update({ is_active: !user.is_active });

    await db('admin_logs').insert({
      admin_id: req.user!.id,
      action: user.is_active ? 'user_deactivated' : 'user_activated',
      entity_type: 'user',
      entity_id: Number(id),
    });

    res.json({ success: true, message: `User ${user.is_active ? 'deactivated' : 'activated'}` });
  } catch (err) { next(err); }
};
