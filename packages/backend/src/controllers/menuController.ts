import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const createMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    const { name, description, price, currency, category, isAvailable, isPopular, preparationTime } = req.body;
    const [id] = await db('menu_items').insert({
      vendor_id: vendor.id,
      name, description, price, currency: currency || 'NGN',
      category, is_available: isAvailable ?? true,
      is_popular: isPopular ?? false,
      preparation_time: preparationTime,
      image_url: req.file ? `/uploads/${req.file.filename}` : null,
    });

    const item = await db('menu_items').where({ id }).first();
    res.status(201).json({ success: true, message: 'Menu item created', data: item });
  } catch (err) { next(err); }
};

export const updateMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    const { id } = req.params;
    const item = await db('menu_items').where({ id, vendor_id: vendor.id }).first();
    if (!item) throw new AppError('Menu item not found', 404);

    const updates: any = {};
    const fields = ['name', 'description', 'price', 'currency', 'category', 'is_available', 'is_popular', 'preparation_time'];
    for (const f of fields) {
      const camel = f.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (req.body[camel] !== undefined) updates[f] = req.body[camel];
    }
    if (req.file) updates.image_url = `/uploads/${req.file.filename}`;

    if (Object.keys(updates).length > 0) {
      await db('menu_items').where({ id }).update(updates);
    }

    const updated = await db('menu_items').where({ id }).first();
    res.json({ success: true, message: 'Menu item updated', data: updated });
  } catch (err) { next(err); }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    const { id } = req.params;
    const item = await db('menu_items').where({ id, vendor_id: vendor.id }).first();
    if (!item) throw new AppError('Menu item not found', 404);

    await db('menu_items').where({ id }).del();
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) { next(err); }
};

export const getVendorMenu = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.params.vendorId || (await db('vendors').where({ user_id: req.user!.id }).first())?.id;
    const menuItems = await db('menu_items').where({ vendor_id: vendorId }).orderBy('category').orderBy('name');
    res.json({ success: true, data: menuItems });
  } catch (err) { next(err); }
};

export const toggleAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await db('vendors').where({ user_id: req.user!.id }).first();
    if (!vendor) throw new AppError('Vendor not found', 404);

    const { id } = req.params;
    const item = await db('menu_items').where({ id, vendor_id: vendor.id }).first();
    if (!item) throw new AppError('Menu item not found', 404);

    await db('menu_items').where({ id }).update({ is_available: !item.is_available });
    res.json({ success: true, message: `Item is now ${item.is_available ? 'unavailable' : 'available'}` });
  } catch (err) { next(err); }
};
