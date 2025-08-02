export const registerUser = (req, res) => {
  res.status(201).json({ message: "User registered successfully" });
 
};


// import User from '../models/userModel.js';
// import bcrypt from 'bcryptjs';

// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, role, phone, bio, location, profilePic } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'Name, email, and password are required' });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

    
//     const hashedPassword = await bcrypt.hash(password, 10);

    
//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role,        
//       phone,
//       bio,
//       location,
//       profilePic,  
//     });

    
//     await newUser.save();

    
//     const { password: _, ...userData } = newUser._doc;

//     res.status(201).json({
//       message: 'User registered successfully',
//       user: userData,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Registration failed', error: error.message });
//   }
// };


