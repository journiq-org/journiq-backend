import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  numOfPeople: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed","accepted", "rejected", "completed", "cancelled"],
    default: "pending"
  },
  isDeleted: {
  type: Boolean,
  default: false,
},
experience: {
  serviceQuality: { type: Number, min: 1, max: 5 },
  punctuality: { type: Number, min: 1, max: 5 },
  satisfactionSurvey: { type: Number, min: 1, max: 5 }
},

}, {
  timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
