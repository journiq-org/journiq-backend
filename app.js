import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import userRoute from './routes/user/userRoute.js'
import tourRoute from './routes/tour/tourRoutes.js'
import destinationRoute from './routes/destination/destinationRoutes.js'
import adminRoute from './routes/admin/adminRoutes.js'
import bookingRoute from './routes/booking/bookingRoute.js'
import reviewRoute from './routes/review/reviewRoute.js'
import notificationRoute from './routes/notification/notificationRoutes.js'
import messageRoutes from "./routes/message/messageRoute.js";
import cookieParser from 'cookie-parser'


dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()


connectDB()

app.use(cors({
  origin: "http://localhost:3000", // your frontend URL
  credentials: true               // allow cookies
}))
app.use('/uploads', express.static('uploads'));
app.use(express.json()) 
app.use(cookieParser())


// app.use(express.json()) 
// app.use(cors())


app.use('/api/users', userRoute)
app.use('/api/tour',tourRoute)
app.use('/api/destination',destinationRoute)
app.use('/api/admin',adminRoute)
app.use('/api/booking',bookingRoute)
app.use('/api/review', reviewRoute)
app.use('/api/notification',notificationRoute)
app.use("/api/messages", messageRoutes);

// app.use((error, req, res, next) => {
//   res.status(error.code || 500).json({
//     message: error.message || "An unknown error occurred",
//   });
// });


app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(error.code || 500).json({
    status: false,
    message: error.message || "An unknown error occurred",
    error: process.env.NODE_ENV === 'development' ? {
      name: error.name,
      stack: error.stack
    } : undefined
  });
});


// Start server
app.listen(PORT, () => console.log(`Server running on ${PORT}`))
