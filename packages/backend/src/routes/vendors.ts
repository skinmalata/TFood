import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as vendorController from '../controllers/vendorController';
import * as menuController from '../controllers/menuController';
import { validate } from '../middleware/validate';
import { createMenuItemSchema, updateMenuItemSchema } from '../validators/menu';

const router = Router();

// Vendor profile
router.get('/me', authenticate, authorize('vendor'), vendorController.getVendorProfile);
router.patch('/me', authenticate, authorize('vendor'), vendorController.updateVendorProfile);
router.post('/toggle-open', authenticate, authorize('vendor'), vendorController.toggleOpen);

// Documents
router.post('/documents', authenticate, authorize('vendor'), upload.single('file'), vendorController.uploadDocument);

// Menu management
router.get('/menu', authenticate, authorize('vendor'), menuController.getVendorMenu);
router.post('/menu', authenticate, authorize('vendor'), upload.single('image'), validate(createMenuItemSchema), menuController.createMenuItem);
router.patch('/menu/:id', authenticate, authorize('vendor'), upload.single('image'), validate(updateMenuItemSchema), menuController.updateMenuItem);
router.delete('/menu/:id', authenticate, authorize('vendor'), menuController.deleteMenuItem);
router.patch('/menu/:id/toggle', authenticate, authorize('vendor'), menuController.toggleAvailability);

// Orders
router.get('/orders', authenticate, authorize('vendor'), vendorController.getVendorOrders);

// Dashboard stats
router.get('/dashboard', authenticate, authorize('vendor'), vendorController.getDashboardStats);

// Public vendor profile
router.get('/public/:id', vendorController.getVendorPublicProfile);

export default router;
