import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as mapsService from '../services/maps';

export const getNearbyVendors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius = 10, cuisine, page = 1, limit = 20 } = req.query;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const offset = (Number(page) - 1) * Number(limit);

    const nearbyVendors = await mapsService.findNearbyVendors(lat, lng, Number(radius));

    let filtered = nearbyVendors;
    if (cuisine) {
      filtered = filtered.filter((v: any) => v.cuisine_type.toLowerCase() === (cuisine as string).toLowerCase());
    }

    // Paginate after filter
    const paginated = filtered.slice(offset, offset + Number(limit));

    // Enrich with delivery estimates and menu items
    const enriched = await Promise.all(paginated.map(async (vendor: any) => {
      const menuItems = await db('menu_items').where({ vendor_id: vendor.id, is_available: true }).limit(5);
      let deliveryEstimate = null;

      try {
        deliveryEstimate = await mapsService.getDeliveryEstimate(
          vendor.latitude, vendor.longitude,
          lat, lng,
          vendor.preparation_time,
          vendor.delivery_radius
        );
      } catch { }

      return { vendor, menuItems, deliveryEstimate };
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / Number(limit)),
      },
    });
  } catch (err) { next(err); }
};

export const searchVendors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, cuisine, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('vendors')
      .join('users', 'vendors.user_id', 'users.id')
      .where('vendors.status', 'approved')
      .select('vendors.*', 'users.first_name', 'users.last_name', 'users.avatar_url');

    if (q) {
      query = query.where(function () {
        this.where('vendors.business_name', 'like', `%${q}%`)
          .orWhere('vendors.cuisine_type', 'like', `%${q}%`)
          .orWhere('vendors.description', 'like', `%${q}%`);
      });
    }

    if (cuisine) {
      query = query.where('vendors.cuisine_type', cuisine as string);
    }

    const [{ count }] = await query.clone().count('* as count');
    const vendors = await query.clone().orderBy('vendors.rating', 'desc').offset(offset).limit(Number(limit));

    res.json({
      success: true, data: vendors,
      pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(count / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const getCuisineTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cuisines = await db('vendors')
      .where('status', 'approved')
      .distinct('cuisine_type')
      .orderBy('cuisine_type');

    res.json({ success: true, data: cuisines.map((c: any) => c.cuisine_type) });
  } catch (err) { next(err); }
};
