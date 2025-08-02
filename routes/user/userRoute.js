// routes/userRoutes.js
import express from 'express';
import { check } from 'express-validator';
import { registerUser, userLogin } from '../../controllers/user/userController.js';

const router = express.Router();

// ✅ POST route for registration
router.post('/register', registerUser);

// ✅ POST route for login with validations
router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Email must be valid'),
    check('password').notEmpty().withMessage('Password is required'),
  ],
  userLogin
);

export default router;
