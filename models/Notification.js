import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "booking_request",
        "booking_confirmed",
        "booking_cancelled",
        "payment_received",
        "tour_updated",
        "admin_announcement",
        "guide_verified",
        "tour_blocked",
        "tour_unblocked",
        "custom",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: null,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    relatedTour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted:{
      type: Boolean,
      default: false
    }
  },
    {
    timestamps: true    
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
