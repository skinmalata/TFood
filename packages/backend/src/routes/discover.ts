import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import * as discoverController from '../controllers/discoverController';

const router = Router();

router.get('/nearby', discoverController.getNearbyVendors);
router.get('/search', discoverController.searchVendors);
router.get('/cuisines', discoverController.getCuisineTypes);

export default router;
