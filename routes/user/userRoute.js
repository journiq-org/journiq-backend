// routes/userRoutes.js
import express from 'express';
import { check } from 'express-validator';
import { changePassword, deleteUser, editUserProfile, getUserProfile, registerUser, userLogin } from '../../controllers/user/userController.js';
import userAuthCheck from '../../middlewares/userAuthCheck.js';

const router = express.Router();

// POST route for registration
router.post('/register',[
  check('name')
    .isEmail()
    .withMessage('name is required'),
  check('email')
    .isEmail()
    .withMessage('email is required'),
  check('password')
    .isLength({ min: 8 })
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
router.post(
  '/login',[
    check('email')
      .isEmail()
      .withMessage('Email must be valid'),
    check('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],userLogin);

// GET route for user profile
router.get('/view-profile', userAuthCheck, getUserProfile);

// PATCH route for editing user profile
router.patch('/edit-profile',userAuthCheck, editUserProfile)

// DELETE route for deleting user account
router.delete('/deleteUser', userAuthCheck, deleteUser );

// PATCH route for changing password
router.patch('/ChangePassword' , userAuthCheck , changePassword )

export default router;
