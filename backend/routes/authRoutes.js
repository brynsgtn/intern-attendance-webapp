import express from 'express';
import { 
    checkAuth, 
    forgetPassword, 
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
router.get('/forgetPassword', forgetPassword);
router.get('/resetPassword', resetPassword);
router.get('/checkAuth', checkAuth);

export default router; 