import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js"; // adjust path if needed

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    const admin = new User({
      name: "Super Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin",
      isVerified: true
    });

    await admin.save();
    console.log(`✅ Admin user created successfully: ${admin.email}`);
    process.exit();
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
