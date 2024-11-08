import express from 'express';
import { register, login, getUserProfile } from '../controllers/authController.js'; // Import the new function
import { verifyToken } from '../middleware/authMiddleware.js'; // Import the middleware

const router = express.Router();

// Register and login routes
router.post('/register', register);
router.post('/login', login);

// Protected route for fetching user profile
router.get('/profile', verifyToken, getUserProfile); // Use verifyToken middleware for authentication

export default router;
