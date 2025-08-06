import Booking from '../../models/Booking.js';
import Tour from '../../models/Tour.js';
import HttpError from '../../middlewares/httpError.js';

const updateAvailabilitySlots = (tour, bookingDate, numOfPeople) => {
  const bookingDateOnly = new Date(bookingDate).toISOString().split('T')[0];

  const availability = tour.availability.find((a) => {
    const availableDateOnly = new Date(a.date).toISOString().split('T')[0];
    return bookingDateOnly === availableDateOnly;
  });

  if (!availability || availability.slots < numOfPeople) {
    throw new HttpError("Not enough slots available on selected date", 400);
  }

  availability.slots -= numOfPeople;
  return tour;
};

// Create Booking
export const createBooking = async (req, res, next) => {
  try {
    const { tourId, date, numOfPeople } = req.body;
    const {user_id: travellerId} = req.user_data

    const tour = await Tour.findById(tourId);
    if (!tour) return next(new HttpError("Tour not found", 404));

    try {
      updateAvailabilitySlots(tour, date, numOfPeople);
    } catch (error) {
      return next(error);
    }

    const totalPrice = tour.price * numOfPeople;

    const booking = new Booking({
      tour: tour._id, 
      user: travellerId,
      date,
      numOfPeople,
      totalPrice,
    });

    await booking.save();
    tour.markModified('availability'); 
    await tour.save();

    res.status(201).json({ message: "Booking successful", booking });
  } catch (error) {
    next(error);
  }
};

// Get Booking by Id
export const getBookings = async (req, res, next) => {
    try {
        const {user_id:travellerId, user_role: tokenRole} = req.user_data;

        if(tokenRole !== 'traveller') {
            return next(new HttpError("Only traveller can access their bookings", 403));
            }else{
            const bookings = await Booking.find({user: travellerId,isDeleted:false}).populate("tour");

            if(!bookings || bookings.length === 0) {
                return res.status(404).json({ message: "No bookings found" });
            }
            res.status(200).json({ bookings });
        }
        } catch (error) {
                next(error);
        }
}
    
// Update Booking Status
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { user_role: tokenRole } = req.user_data;
    const { id:bookingId } = req.params;
    const { status } = req.body;

    // Only admin or guide allowed to update status
    if (tokenRole !== "guide") {
      return next(new HttpError("Unauthorized access", 403));
    }

    // Allowed statuses
    const validStatuses = ["confirmed", "cancelled", "completed", "pending"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    // Update booking status
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    ).populate("tour");

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking status updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Booking by Traveller
export const cancelBookingByUser = async (req, res, next) => {
  try {
    const { user_id: travellerId, user_role: tokenRole } = req.user_data;
    const { bookingId } = req.params;

    // Only travellers can cancel their bookings
    if (tokenRole !== 'traveller') {
      return next(new HttpError("Only travellers can cancel bookings", 403));
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Ensure the booking belongs to the current traveller
    if (booking.user.toString() !== travellerId) {
      return next(new HttpError("Unauthorized: Not your booking", 403));
    }

    // Prevent cancelling already cancelled or completed bookings
    if (["cancelled", "completed"].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// Respond to Booking by Guide (Accept or Reject)
export const respondToBookingByGuide = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const { user_id, user_role } = req.user_data;

    // Only a guide can respond
    if (user_role !== "guide") {
      return next(new HttpError("Only guides can respond to bookings", 403));
    }

    // Validate status
    const allowedStatuses = ["accepted", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return next(new HttpError("Invalid status. Must be 'accepted' or 'rejected'.", 400));
    }

    // Find booking and populate the tour
    const booking = await Booking.findById(bookingId).populate("tour");
    if (!booking) {
      return next(new HttpError("Booking not found", 404));
    }

    // Check if the current guide is the one assigned to the tour
    const tourGuideId = booking.tour?.guide?.toString();
    if (!tourGuideId || tourGuideId !== user_id) {
      return next(new HttpError("Unauthorized to respond to this booking", 403));
    }

    // Prevent re-updating already finalized bookings
    if (booking.status === "accepted" || booking.status === "rejected") {
      return next(new HttpError(`Booking has already been ${booking.status}`, 400));
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    return res.status(200).json({
      message: `Booking ${status} successfully.`,
      booking,
    });
  } catch (error) {
    console.error("Booking response error:", error);
    return next(new HttpError("Something went wrong while responding to the booking", 500));
  }
};

// Delete Booking by Guide & Admin
export const deleteBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { user_id, user_role } = req.user_data;

    // Optional: Check if user is allowed to delete the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new HttpError("Booking not found", 404));
    }

    // Only the user who created the booking or an admin/guide can delete
    if (
      booking.user.toString() !== user_id &&
      user_role !== "admin" &&
      user_role !== "guide"
    ) {
      return next(new HttpError("Unauthorized to delete this booking", 403));
    }

    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Check the Availability
export const checkAvailability = async (req, res, next) => {
  try {
    const { date, guideId } = req.query;

    if (!date || !guideId) {
      return next(new HttpError("Date and Guide ID are required", 400));
    }

    const existingBooking = await Booking.findOne({
      guide: guideId,
      date: new Date(date),
    });

    if (existingBooking) {
      return res.status(200).json({ available: false });
    }

    res.status(200).json({ available: true });
  } catch (error) {
    next(error);
  }
};
