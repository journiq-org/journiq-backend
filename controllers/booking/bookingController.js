<<<<<<< Updated upstream
import Booking from "../../models/Booking.js";
import Review from "../../models/Review.js";
import { updateTourRatings } from "../../utils/updateTourRatings.js";
import HttpError from "../../middlewares/httpError.js";
import Tour from "../../models/Tour.js";

export const addExperienceToBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { serviceQuality, punctuality, satisfactionSurvey, comment } = req.body;
    const { user_id: travellerId } = req.user_data;

    const booking = await Booking.findById(bookingId).populate("tour");
    if (!booking) return next(new HttpError("Booking not found", 404));

    if (booking.user.toString() !== travellerId) {
      return next(new HttpError("Unauthorized: Not your booking", 403));
    }

    if (booking.status !== "completed") {
      return next(new HttpError("You can only rate completed tours", 400));
    }

    booking.experience = { serviceQuality, punctuality, satisfactionSurvey };
    await booking.save();

    // Calculate rating
    const rating = Math.round(
      ((serviceQuality + punctuality + satisfactionSurvey) / 3) * 10
    ) / 10;

    // Create review if not already exists
    const existingReview = await Review.findOne({ user: travellerId, tour: booking.tour._id });
    if (!existingReview) {
      await Review.create({
        user: travellerId,
        tour: booking.tour._id,
        rating,
        comment,
        experience: booking.experience
      });
    }

    // Update the tour’s average rating
    await updateTourRatings(booking.tour._id);

    res.status(201).json({ message: "Experience and review added successfully" });
  } catch (error) {
    next(error);
  }
};

=======
import Booking from '../../models/Booking.js';
import Tour from '../../models/Tour.js';
import HttpError from '../../middlewares/httpError.js';
import Notification from '../../models/Notification.js'
import transporter from '../../config/email.js';
import User from '../../models/User.js'
>>>>>>> Stashed changes

export const updateAvailabilitySlots = (tour, bookingDate, numOfPeople) => {
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

// Create Booking (email + inapp)
export const createBooking = async (req, res, next) => {
  try {
    const { tourId, date, numOfPeople } = req.body;
    const {user_id: travellerId} = req.user_data

    const tour = await Tour.findById(tourId).populate('guide', 'name email')
    if (!tour) return next(new HttpError("Tour not found", 404));

     //  Get traveller details from DB
    const traveller = await User.findById(travellerId).select("name email");
    if (!traveller) return next(new HttpError("Traveller not found", 404));

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

        // NOTIFICATIONS
        
    const guide = tour.guide;
    
    if (guide) {
      //  In-app notification
      await Notification.create({
        recipient: guide._id,
        sender: travellerId,
        type: "booking_request",
        message: `${traveller.name} has requested a booking for your tour "${tour.title}" on ${date}.`,
        relatedBooking: booking._id,
        relatedTour: tour._id,
        isRead: false,
      });

      //  Email notification
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: guide.email,
        subject: `New Booking Request for "${tour.title}"`,
        template: "bookingRequestNotification", // Handlebars template filename
        context: {
          guideName: guide.name,
          travellerName: req.user_data.name,
          tourTitle: tour.title,
          bookingDate: date,
          numOfPeople,
        },
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`Failed to send booking request email:`, error);
        } else {
          console.log(`Booking request email sent to ${guide.email}: ${info.response}`);
        }
      });
    }

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
    const { user_role } = req.user_data;
    const { id } = req.params;
    const { status } = req.body;

    // Only guide or admin can update
    if (!["guide", "admin"].includes(user_role)) {
      return next(new HttpError("Unauthorized access", 403));
    }

    // Valid statuses guide/admin can set
    const validStatuses = ["confirmed", "completed", "cancelled", "pending"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ) 
    .populate("tour")
    .populate("traveller", "name email")
    .populate("guide", "name email");

    if (!booking) return res.status(404).json({ message: "Booking not found" });


        // Determine notification type and message based on status
    let notifType, notifMessage, emailSubject, emailTemplate;

    switch (status) {
      case "confirmed":
        notifType = "booking_confirmed";
        notifMessage = `Your booking for "${booking.tour.title}" has been confirmed.`;
        emailSubject = `Booking Confirmed: "${booking.tour.title}"`;
        emailTemplate = "bookingConfirmedNotification";
        break;
      case "completed":
        notifType = "custom";
        notifMessage = `Your tour "${booking.tour.title}" has been completed.`;
        emailSubject = `Tour Completed: "${booking.tour.title}"`;
        emailTemplate = "bookingCompletedNotification";
        break;
      case "cancelled":
        notifType = "booking_cancelled";
        notifMessage = `Your booking for "${booking.tour.title}" has been cancelled.`;
        emailSubject = `Booking Cancelled: "${booking.tour.title}"`;
        emailTemplate = "bookingCancelledNotification";
        break;
      default:
        notifType = "custom";
        notifMessage = `Booking status for "${booking.tour.title}" has been updated to ${status}.`;
        emailSubject = `Booking Status Updated: "${booking.tour.title}"`;
        emailTemplate = "bookingStatusUpdatedNotification";
    }

    // In-app notification to traveller
    await Notification.create({
      recipient: booking.traveller._id,
      sender: user_id,
      type: notifType,
      message: notifMessage,
      relatedBooking: booking._id,
      relatedTour: booking.tour._id,
      isRead: false,
    });

    // Email notification to traveller
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.traveller.email,
      subject: emailSubject,
      template: emailTemplate, // Handlebars template filename
      context: {
        travellerName: booking.traveller.name,
        tourTitle: booking.tour.title,
        bookingDate: booking.date,
        guideName: booking.guide.name,
        status: status,
      },
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`Failed to send booking status update email:`, error);
      } else {
        console.log(`Booking status update email sent to ${booking.traveller.email}: ${info.response}`);
      }
    });


    res.status(200).json({
      message: "Booking status updated",
      booking,
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
    const booking = await Booking.findById(bookingId)
    .populate("tour")
      .populate({
        path: "tour",
        populate: { path: "guide", select: "name email" },
      });


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


    //  In-app notification (to Guide)
    if (booking.tour && booking.tour.guide) {
      await Notification.create({
        recipient: booking.tour.guide._id,
        sender: travellerId,
        type: "booking_cancelled",
        message: `${travellerName} has cancelled their booking for your tour "${booking.tour.title}".`,
        relatedBooking: booking._id,
        relatedTour: booking.tour._id,
        isRead: false,
      });

      //  Email notification (to Guide)
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.tour.guide.email,
        subject: `Booking Cancelled: "${booking.tour.title}"`,
        template: "bookingCancelledByTravellerNotification", // Handlebars template file
        context: {
          guideName: booking.tour.guide.name,
          travellerName: travellerName,
          tourTitle: booking.tour.title,
          bookingDate: booking.date,
        },
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(` Failed to send cancellation email:`, error);
        } else {
          console.log(
            ` Cancellation email sent to ${booking.tour.guide.email}: ${info.response}`
          );
        }
      });
    }



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
    const booking = await Booking.findById(bookingId)
     .populate("tour")
     .populate("user", "name email"); // populate traveller

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


    //  In-app notification
    await Notification.create({
      recipient: booking.user._id,
      sender: user_id,
      type: "booking_" + status, // booking_accepted / booking_rejected
      message: `Your booking for "${booking.tour.title}" was ${status} by the guide.`,
      link: `/bookings/${booking._id}`,
      relatedBooking: booking._id,
      relatedTour: booking.tour._id,
    });

    //  Email notification

    // Load handlebars template
    const __dirname = path.resolve(); // ES modules
    const templatePath = path.join(
      __dirname,
      "templates",
      "bookingResponse.hbs"
    );
    const source = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(source);

    const emailHtml = template({
      travellerName: booking.user.name,
      guideName: req.user_data.name || "Guide",
      tourTitle: booking.tour.title,
      status: status,
      bookingLink: `https://yourfrontend.com/bookings/${booking._id}`,
    });

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Journiq" <${process.env.MAIL_USER}>`,
      to: booking.user.email,
      subject: `Your booking was ${status}`,
      html: emailHtml,
    });



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

    booking.isDeleted = true;
      await booking.save();


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
    const { date, tourId } = req.query;

    if (!date || !tourId) {
      return next(new HttpError("Date and Tour ID are required", 400));
    }

    const tour = await Tour.findById(tourId);
    if (!tour) return next(new HttpError("Tour not found", 404));

    const bookingDate = new Date(date).toISOString().split("T")[0];
    const availability = tour.availability.find((a) => {
      return new Date(a.date).toISOString().split("T")[0] === bookingDate;
    });

    if (!availability || availability.slots <= 0) {
      return res.status(200).json({ available: false });
    }

    res.status(200).json({ available: true, slots: availability.slots });
  } catch (error) {
    next(error);
  }
};

