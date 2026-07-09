import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as adminController from '../controllers/adminController';

const router = Router();

// Dashboard
router.get('/dashboard', authenticate, authorize('admin'), adminController.getAdminDashboard);

// User management
router.get('/users', authenticate, authorize('admin'), adminController.getAdminUsers);
router.patch('/users/:id/toggle-status', authenticate, authorize('admin'), adminController.toggleUserStatus);

// Vendor management
router.get('/vendors', authenticate, authorize('admin'), adminController.listVendors);
router.patch('/vendors/:id/status', authenticate, authorize('admin'), adminController.updateVendorStatus);
router.get('/vendors/:id/documents', authenticate, authorize('admin'), adminController.getVendorDocuments);
router.patch('/documents/:id/verify', authenticate, authorize('admin'), adminController.verifyDocument);

// Dispute management
router.get('/disputes', authenticate, authorize('admin'), adminController.listDisputes);
router.patch('/disputes/:id/resolve', authenticate, authorize('admin'), adminController.resolveDispute);

// Audit logs
router.get('/logs', authenticate, authorize('admin'), adminController.getAdminLogs);

export default router;
