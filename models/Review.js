import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔹 Calculate & update tour average rating
reviewSchema.statics.updateTourRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId, isDeleted: false } },
    {
      $group: {
        _id: "$tour",
        avgRating: { $avg: "$rating" },
        ratingsCount: { $sum: 1 },
      },
    },
  ]);

  await mongoose.model("Tour").findByIdAndUpdate(tourId, {
  rating: stats.length ? stats[0].avgRating.toFixed(1) : 0, // optional, sync 'rating'
  averageRating: stats.length ? stats[0].avgRating.toFixed(1) : 0,
  ratingsCount: stats.length ? stats[0].ratingsCount : 0,
});

};

// After save
reviewSchema.post("save", function () {
  this.constructor.updateTourRatings(this.tour);
});

// After update/delete
reviewSchema.post("findOneAndUpdate", function (doc) {
  if (doc) doc.constructor.updateTourRatings(doc.tour);
});
reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) doc.constructor.updateTourRatings(doc.tour);
});

export default mongoose.model("Review", reviewSchema);
