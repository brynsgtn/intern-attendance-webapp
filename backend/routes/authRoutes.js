import express from 'express';
import { 
    checkAuth, 
    forgotPassword, 
    login, 
    logout, 
    resetPassword, 
    signup, 
    verifyEmail 
} from '../controllers/authControllers.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.get('/resetPassword', resetPassword);
router.get('/checkAuth', checkAuth);

export default router; 