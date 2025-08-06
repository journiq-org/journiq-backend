import express, { Router } from 'express';
import { check } from 'express-validator';
import { changePassword, deleteUser, editUserProfile, getUserProfile, registerUser, userLogin } from '../../controllers/user/userController.js';
import userAuthCheck from '../../middlewares/userAuthCheck.js';
import upload from '../../middlewares/fileUpload.js';

const userRoute = Router();

// POST route for registration
userRoute.post('/register',upload.single('profilePic'),[
  check('name')
    .notEmpty()
    .withMessage('name is required'),
  check('email')
    .isEmail()
    .withMessage('email is required'),
  check('password')
    .isLength({ min:4 })
    .withMessage('password is required'),
  check('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  check('bio')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Bio must be under 300 characters'),
  check('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),  
  ],registerUser);

// POST route for login with validations
userRoute.post('/login',[
    check('email')
      .isEmail()
      .withMessage('Email must be valid'),
    check('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],userLogin);


userRoute.use(userAuthCheck)

// GET route for user profile
userRoute.get('/view-profile', getUserProfile);

// PATCH route for editing user profile
userRoute.patch('/edit-profile',upload.single('profilePic'), editUserProfile)

// DELETE route for deleting user account
userRoute.delete('/deleteUser', deleteUser );

// PATCH route for changing password
userRoute.patch('/ChangePassword' , changePassword )

export default userRoute;
