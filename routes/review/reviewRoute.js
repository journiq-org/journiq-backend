import express from 'express';
import {
  addReview,
  deleteReview,
  getReviewsByRole,
  getReviewsForTour,
  updateReview,
  getTopTours,
  getTopReviews
} from '../../controllers/review/reviewController.js';
import userAuthCheck from '../../middlewares/userAuthCheck.js';

const reviewRoute = express.Router();
reviewRoute.get('/tour/:tourId', getReviewsForTour);
reviewRoute.get('/topReview',getTopReviews)

reviewRoute.use(userAuthCheck);

reviewRoute.post('/:tourId', addReview);

reviewRoute.get('/top', getTopTours);   // authentication required
reviewRoute.delete('/delete/:id', deleteReview);
reviewRoute.patch('/update/:id', updateReview);
reviewRoute.get('/get-all-review', getReviewsByRole);

export default reviewRoute;
