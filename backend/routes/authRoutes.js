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

router.get('/signup', signup);
router.get('/verify-email', verifyEmail);
router.get('/login', login);
router.get('/logout', logout);
router.get('/forgetPassword', forgetPassword);
router.get('/resetPassword', resetPassword);
router.get('/checkAuth', checkAuth);

export default router; 