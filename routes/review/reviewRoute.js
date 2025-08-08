import express from 'express';
import { addReview, deleteReview, getReviewsByRole, getReviewsForTour, updateReview } from '../../controllers/review/reviewController.js';
import userAuthCheck from '../../middlewares/userAuthCheck.js';

const reviewRoute = express.Router();

reviewRoute.use(userAuthCheck)

// Add a User Review
reviewRoute.post('/add', addReview),

// Get review for tour 
reviewRoute.get('/tour/:tourId', getReviewsForTour),

// Delete review by Id
reviewRoute.delete('/delete/:id', deleteReview),

// Update review by Id
reviewRoute.patch('/update/:id', updateReview),

// Get all review 
reviewRoute.get('/get-all-review', getReviewsByRole)



export default reviewRoute;