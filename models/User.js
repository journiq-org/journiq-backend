import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,       
    trim: true,
  },
  email: {
    type: String,
    required: true,       
    unique: true,        
    lowercase: true,       
    trim: true,
  },
  password: {
    type: String,
    required: true,       
    minlength: 6,         
  },
  role: {
    type: String,
    enum: ['traveller', 'guide', 'admin'],
    default: 'traveller',
  },
  profilePic: {
    type: String,
    default: '',           
  },
  phone: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    maxlength: 200,
  },
  location: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,        
  },
    isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true        
});

const User = mongoose.model('User', userSchema);

export default User;
