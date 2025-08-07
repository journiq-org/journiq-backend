import Review from "../../models/Review.js";
import Booking from "../../models/Booking.js";
import HttpError from "../../middlewares/httpError.js";

export const addReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user_data.user_id;

    if (rating === undefined || !comment || !bookingId) {
      return next(new HttpError("Rating, comment, and booking ID are required", 422));
    }

    const booking = await Booking.findById(bookingId).populate("tour");

    if (!booking) {
      return next(new HttpError("Booking not found", 404));
    }

    if (!booking.user || booking.user.toString() !== userId) {
      return next(new HttpError("You can only review your own bookings", 403));
    }

    const existingReview = await Review.findOne({ user: userId, tour: booking.tour._id });

    if (existingReview) {
      return next(new HttpError("You have already reviewed this tour", 400));
    }

    const review = new Review({
      user: userId,
      tour: booking.tour._id,
      rating,
      comment,
    });

    await review.save();

    // ✅ Properly populate the saved review
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name')
      .populate('tour', 'title');

    res.status(201).json({
      message: "Review submitted successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Get all reviews for a tour
export const getReviewsForTour = async (req, res, next) => {
  try {
    const { tourId } = req.params;

    const reviews = await Review.find({ tour: tourId, isDeleted: false })
      .populate("user", "name profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

