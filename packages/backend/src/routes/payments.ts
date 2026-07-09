import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as paymentController from '../controllers/paymentController';

const router = Router();

router.get('/verify/:reference', authenticate, paymentController.verifyPayment);
router.post('/charge-card', authenticate, paymentController.chargeCard);
router.get('/history', authenticate, paymentController.getPaymentHistory);
router.post('/webhook/paystack', paymentController.paystackWebhook);

export default router;
