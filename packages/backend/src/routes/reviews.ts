import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as reviewController from '../controllers/reviewController';
import { createReviewSchema, createDisputeSchema } from '../validators/review';

const router = Router();

router.post('/', authenticate, validate(createReviewSchema), reviewController.createReview);
router.get('/vendor/:vendorId', reviewController.getVendorReviews);
router.post('/disputes', authenticate, validate(createDisputeSchema), reviewController.createDispute);

export default router;
