import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as chatController from '../controllers/chatController';

const router = Router();

router.post('/messages', authenticate, upload.single('file'), chatController.sendMessage);
router.get('/messages/:orderId', authenticate, chatController.getMessages);
router.patch('/messages/:orderId/read', authenticate, chatController.markAsRead);
router.post('/calls', authenticate, chatController.initiateCall);
router.get('/unread', authenticate, chatController.getUnreadCount);

export default router;
