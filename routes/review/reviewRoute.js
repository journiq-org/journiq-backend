import express from 'express';
import { addReview, getReviewsForTour } from '../../controllers/review/reviewController.js';
import userAuthCheck from '../../middlewares/userAuthCheck.js';

const reviewRoute = express.Router();
reviewRoute.use(userAuthCheck)

// POST /api/reviews - Add a new review (only for authenticated users)
reviewRoute.post('/', addReview);
reviewRoute.get('/tour/:tourId', getReviewsForTour);


export default reviewRoute;
