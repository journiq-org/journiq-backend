import Review from "../../models/Review.js";
import Tour from "../../models/Tour.js";
import HttpError from "../../middlewares/httpError.js";
import Booking from "../../models/Booking.js";

// Add Review
// export const addReview = async (req, res, next) => {
//   try {
//     const { tourId } = req.params;
//     const { serviceQuality, punctuality, satisfactionSurvey, comment } = req.body;

//     const tour = await Tour.findById(tourId);
//     if (!tour) return next(new HttpError("Tour not found", 404));

//     const review = new Review({
//       tour: tourId,
//       user: req.user_data.user_id,
//       experience: { serviceQuality, punctuality, satisfactionSurvey },
//       comment,
//     });

//     await review.save();
//     res.status(201).json({ message: "Review added successfully", review });
//   } catch (error) {
//     next(error);
//   }
// };


export const addReview = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const { bookingId, serviceQuality, punctuality, satisfactionSurvey, comment } = req.body;

    // ✅ Check if tour exists
    const tour = await Tour.findById(tourId);
    if (!tour) return next(new HttpError("Tour not found", 404));

    // ✅ Ensure user has a valid completed booking for this tour
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user_data.user_id,
      tour: tourId,
      status: "completed", // allow review only if completed
    });

    if (!booking) {
      return next(
        new HttpError("You must complete a booking before leaving a review", 400)
      );
    }

    // ✅ Prevent duplicate reviews (1 review per booking)
    const existingReview = await Review.findOne({ booking: bookingId, user: req.user_data.user_id });
    if (existingReview) {
      return next(new HttpError("You already reviewed this booking", 400));
    }

    // ✅ Create new review
    const review = await Review.create({
      tour: tourId,
      booking: bookingId,
      user: req.user_data.user_id,
      experience: { serviceQuality, punctuality, satisfactionSurvey },
      comment,
    });

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    next(error);
  }
};

// Get High-Demand Tours
export const getTopTours = async (req, res, next) => {
  try {
    const tours = await Tour.find().sort({ averageRating: -1, ratingsCount: -1 }).limit(10);
    res.status(200).json(tours);
  } catch (error) {
    next(error);
  }
};

// Get reviews for a tour
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

// Delete Review
export const deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user_data.user_id;

    const review = await Review.findById(reviewId);
    if (!review) return next(new HttpError("Review not found", 404));
    if (review.user.toString() !== userId) return next(new HttpError("You can only delete your own reviews", 403));

    review.isDeleted = true;
    await review.save();
    await Review.updateTourRatings(review.tour);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Update Review
export const updateReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user_data.user_id;
    const { serviceQuality, punctuality, satisfactionSurvey, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review || review.isDeleted) return next(new HttpError("Review not found", 404));
    if (review.user.toString() !== userId) return next(new HttpError("You can only update your own reviews", 403));

    if (serviceQuality) review.experience.serviceQuality = serviceQuality;
    if (punctuality) review.experience.punctuality = punctuality;
    if (satisfactionSurvey) review.experience.satisfactionSurvey = satisfactionSurvey;
    if (comment) review.comment = comment;

    await review.save();
    await Review.updateTourRatings(review.tour);

    res.status(200).json({ message: "Review updated", review });
  } catch (error) {
    next(error);
  }
};

// Get reviews by role
// Get reviews by role (admin / guide / traveller)
export const getReviewsByRole = async (req, res, next) => {
  try {
    const userId = req.user_data.user_id;
    const userRole = req.user_data.user_role;
    if (!userId || !userRole) return next(new HttpError("Unauthorized access", 403));

    let reviews = [];

    if (userRole === "admin") {
      // All reviews
      reviews = await Review.find({ isDeleted: false })
        .populate("user", "name")
        .populate("tour", "title")
        .sort({ createdAt: -1 });
    } else if (userRole === "guide") {
      // Reviews for tours created by guide
      const tours = await Tour.find({ createdBy: userId }).select("_id");
      reviews = await Review.find({ tour: { $in: tours.map(t => t._id) }, isDeleted: false })
        .populate("user", "name")
        .populate("tour", "title")
        .sort({ createdAt: -1 });
    } else if (userRole === "traveller") {
      // Reviews written by this traveller
      reviews = await Review.find({ user: userId, isDeleted: false })
        .populate("tour", "title")
        .sort({ createdAt: -1 });
    } else {
      return next(new HttpError("Unauthorized access", 403));
    }

    res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};
