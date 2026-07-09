import { Router } from 'express';
import { register, login, getProfile, updateProfile, initPasswordReset, updatePassword, saveCard } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.post('/password/reset', initPasswordReset);
router.patch('/password', authenticate, updatePassword);
router.post('/cards', authenticate, saveCard);

export default router;
