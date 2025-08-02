import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'



//load .env variables
dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()

//connect to mongodb
connectDB()

//middleware
// app.use('/uploads', express.static('uploads'));     //serve static uploads
app.use(express.json())                             //parse incoming JSON
app.use(cors())

//routes
// app.use('/api/users', userRoute)


//global error handling
app.use((error,req, res,next) => {
    res.status(error.code || 500).json({
        message: error.message || "An unknown error occurred",
    });
});

//start server
app.listen(PORT,() => console.log(`Server running on http://localhost:${PORT}`))