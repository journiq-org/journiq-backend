import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import userRoute from './routes/user/userRoute.js'


dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()


connectDB()


app.use(express.json()) 
app.use(cors())


app.use('/api/users', userRoute)


app.use((error, req, res, next) => {
  res.status(error.code || 500).json({
    message: error.message || "An unknown error occurred",
  });
});


// Start server
app.listen(PORT, () => console.log(`Server running on ${PORT}`))
