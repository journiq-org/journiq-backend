
// routes/userRoutes.js
import express from 'express';
import { registerUser } from '../../controllers/user/userController.js';


const router = express.Router();

// ✅ POST route for registration
router.post('/register', registerUser);

export default router;

