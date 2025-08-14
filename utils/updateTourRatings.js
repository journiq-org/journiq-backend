import Review from "../models/Review.js";
import Tour from "../models/Tour.js";

export const updateTourRatings = async (tourId) => {
  const stats = await Review.aggregate([
    { $match: { tour: tourId, isDeleted: false } },
    { $group: { _id: "$tour", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    rating: stats[0]?.avgRating || 0,
    totalReviews: stats[0]?.count || 0
  });
};
