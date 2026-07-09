import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as orderController from '../controllers/orderController';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order';

const router = Router();

router.post('/', authenticate, validate(createOrderSchema), orderController.createOrder);
router.get('/consumer', authenticate, orderController.getConsumerOrders);
router.get('/:id', authenticate, orderController.getOrderDetails);
router.patch('/:id/action', authenticate, validate(updateOrderStatusSchema), orderController.handleOrderAction);
router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

export default router;
