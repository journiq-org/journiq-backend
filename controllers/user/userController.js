import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import HttpError from '../../middlewares/httpError.js'; 
import User from '../../models/User.js';


//Register

export const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError('Invalid input: ' + errors.array()[0].msg, 422));
    }

    const {
      name,
      email,
      password,
      role,
      phone,
      bio,
      location
    } = req.body;

    const profilePic = req.file?.path || '';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new HttpError("Email already in use", 400));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      profilePic,
      phone,
      bio,
      location,
      isVerified: false 
    });

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET_KEY || 'default_secret',
      { expiresIn: process.env.JWT_TOKEN_EXPIRY || '7d' }
    );

    // Respond
    res.status(201).json({
      status: true,
      message: "User created successfully",
      access_token: token,
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profilePic: newUser.profilePic,
        role: newUser.role,
        phone: newUser.phone,
        bio: newUser.bio,
        location: newUser.location,
        isVerified: newUser.isVerified
      }
    });

  } catch (error) {
    console.error("Register Error:", error.message || error);
    return next(new HttpError("Registration Failed", 500));
  }
};


// Login

export const userLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(new HttpError("Invalid input: " + errors.array()[0].msg, 422));
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new HttpError("Invalid credentials", 401));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return next(new HttpError("Invalid password", 401));
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_TOKEN_EXPIRY }
    );

    res.status(200).json({
      status: true,
      message: "Login successful",
      access_token: token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    return next(new HttpError("Login failed", 500));
  }
};