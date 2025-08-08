import express, { Router } from 'express';
import { check } from 'express-validator';
import {
  changePassword,
  deleteUser,
  editUserProfile,
  getUserProfile,
  registerUser,
  userLogin
} from '../../controllers/user/userController.js';
import userAuthCheck from '../../middlewares/userAuthCheck.js';
import upload from '../../middlewares/fileUpload.js';

const userRoute = Router();

// PUBLIC ROUTES
userRoute.post(
  '/register',
  upload.single('profilePic'),
  [
    check('name').notEmpty().withMessage('name is required'),
    check('email').isEmail().withMessage('email is required'),
    check('password').isLength({ min: 4 }).withMessage('password is required'),
    check('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    check('bio').optional().isLength({ max: 300 }).withMessage('Bio must be under 300 characters'),
    check('location').optional().isString().withMessage('Location must be a string'),
  ],
  registerUser
);

userRoute.post(
  '/login',
  [
    check('email').isEmail().withMessage('Email must be valid'),
    check('password').notEmpty().withMessage('Password is required'),
  ],
  userLogin
);

// PROTECTED ROUTES
userRoute.use(userAuthCheck);

userRoute.get('/view-profile', getUserProfile);
userRoute.patch('/edit-profile', upload.single('profilePic'), editUserProfile);
userRoute.delete('/deleteUser', deleteUser);
userRoute.patch('/ChangePassword', changePassword);

// Example route with role check (optional)
// userRoute.get('/admin-data', checkRole('admin'), adminControllerFunction);

export default userRoute;
