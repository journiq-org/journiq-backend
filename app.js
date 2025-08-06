import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import userRoute from './routes/user/userRoute.js'
import tourRoute from './routes/tour/tourRoutes.js'
import destinationRoute from './routes/destination/destinationRoutes.js'
import adminRoute from './routes/admin/adminRoutes.js'
import bookingRoute from './routes/booking/bookingRoute.js'


dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()

connectDB()

app.use(express.json()) 
app.use(cors())

app.use('/api/users', userRoute)
app.use('/api/tour',tourRoute)
app.use('/api/destination',destinationRoute)
app.use('/api/admin',adminRoute)

app.use('/api/booking',bookingRoute)

// app.use((error, req, res, next) => {
//   res.status(error.code || 500).json({
//     message: error.message || "An unknown error occurred",
//   });
// });

app.use((error, req, res, next) => {
  const statusCode = typeof error.code === 'number' ? error.code : 500;

  res.status(statusCode).json({
    message: error.message || "An unknown error occurred",
  });
});


// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
