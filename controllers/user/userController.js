import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import HttpError from '../../middlewares/httpError.js'; 
import User from '../../models/User.js';

// Register 
export const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError('Invalid input: ' + errors.array()[0].msg, 422));
    }else{

      const {
        name,
        email,
        password,
        role: inputRole,
        phone,
        bio,
        location
      } = req.body;
  
      const profilePic = req.file?.path || '';

      //  Prevent public admin registration
      if (inputRole && inputRole.toLowerCase() === "admin") {
        return next(new HttpError("You cannot register as admin", 403));
      }
      else{

        //  Default role check (only traveller or guide allowed)
        const role = inputRole && ["traveller", "guide"].includes(inputRole.toLowerCase())
          ? inputRole.toLowerCase()
          : "traveller";
    
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
          { expiresIn: process.env.JWT_TOKEN_EXPIRY || '1d' }
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
      }
    }


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

    // incase of blocked user
    if (user.isBlocked) {
      return next(new HttpError("Your account has been blocked. Please contact support.", 403));
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
      message: "Login successfully",
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

//  User Profile
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user_data.user_id).select('-password');

    if (!user) {
      return next(new HttpError('User not found.', 404));
    }

    res.status(200).json({
      status: true,
      message: "User profile fetched successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error("Fetch Profile Error:", err.message || err);
    next(new HttpError('Fetching user profile failed.', 500));
  }
};

// Edit User Profile
export const editUserProfile = async (req, res, next) => {
  try {
    const userId = req.user_data.user_id;

    const { name, phone, bio, location } = req.body;
    const profilePic = req.file?.path;

    const updatedFields = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(bio && { bio }),
      ...(location && { location }),
      ...(profilePic && { profilePic }),
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return next(new HttpError('User not found.', 404));
    }

    res.status(200).json({
      status: true,
      message: "User profile updated successfully",
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        role: updatedUser.role,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        location: updatedUser.location,
        isVerified: updatedUser.isVerified
      }
    });
  } catch (error) {
    console.error("Edit Profile Error:", error.message || error);
    next(new HttpError('Updating user profile failed.', 500));
  }
};

// delete user 
export const deleteUser = async (req, res, next) => {
  
  try {
    // const {id} =req.params
    const {user_id, user_role: tokenRole} = req.user_data

    const user = await User.findByIdAndUpdate({_id:user_id,isDeleted : false},{isDeleted: true},{new : true}); 

    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    res.status(200).json({
      status: true,
      message:null,
      data: user
    });

  } catch (error) {
    console.error("Delete User Error:", error);
    return next(new HttpError("Failed to delete user", 500));
  }
};

// Change password
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user_data.user_id); 
    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return next(new HttpError("Incorrect old password", 401));
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    return next(new HttpError("Failed to change password", 500));
  }
};

