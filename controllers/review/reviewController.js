import Review from "../../models/Review.js";
import Booking from "../../models/Booking.js";
import HttpError from "../../middlewares/httpError.js";

// Add Review as User
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

    // Properly populate the saved review
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

// Delete Review as User
export const deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user_data.user_id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return next(new HttpError("Review not found", 404));
    }

    if (review.user.toString() !== userId) {
      return next(new HttpError("You can only delete your own reviews", 403));
    }

    review.isDeleted = true;
    await review.save();

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Update Review by UserId
export const updateReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user_data.user_id;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);

    if (!review || review.isDeleted) {
      return next(new HttpError("Review not found", 404));
    }

    if (review.user.toString() !== userId) {
      return next(new HttpError("You can only update your own reviews", 403));
    }

    if (rating !== undefined) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate("user", "name")
      .populate("tour", "title");

    res.status(200).json({ message: "Review updated", review: populatedReview });
  } catch (error) {
    next(error);
  }
};

// Get reviews by role (admin or guide)
export const getReviewsByRole = async (req, res, next) => {
  try {
    const userId = req.user_data.user_id;
    const userRole = req.user_data.user_role; 

    if (!userId || !userRole) {
      return next(new HttpError("Unauthorized access", 403));
    }

    let reviews = [];

    if (userRole === "admin") {
      // Admin can view all reviews
      reviews = await Review.find({ isDeleted: false })
        .populate("user", "name")
        .populate("tour", "title")
        .sort({ createdAt: -1 });
    } else if (userRole === "guide") {
      // Guide sees reviews of their tours only
      const tours = await Tour.find({ createdBy: userId }).select("_id");
      const tourIds = tours.map((t) => t._id);

      reviews = await Review.find({ tour: { $in: tourIds }, isDeleted: false })
        .populate("user", "name")
        .populate("tour", "title")
        .sort({ createdAt: -1 });
    } else {
      return next(new HttpError("Unauthorized access", 403));
    }

    res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
