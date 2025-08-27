import { Router } from "express";
import { addExperienceToBooking, cancelBookingByUser, checkAvailability, createBooking, deleteBooking, getAllBookings, getBookings, getGuideBookings, respondToBookingByGuide, updateBookingStatus } from "../../controllers/booking/bookingController.js";
import userAuthCheck from "../../middlewares/userAuthCheck.js";

const bookingRoute = Router();

bookingRoute.use(userAuthCheck)

// create a new booking
bookingRoute.post('/create-booking', createBooking); 

// get all bookings of the user
bookingRoute.get('/my-booking', getBookings); 

// User confirms or changes status
bookingRoute.patch('/update-status/:id', updateBookingStatus); 

// User cancels booking
bookingRoute.patch('/cancel/:bookingId', cancelBookingByUser); 

// Admin deletes booking
bookingRoute.patch('/admin/delete-booking/:bookingId', deleteBooking); 

//  checks availability 
bookingRoute.get('/checkAvailability', checkAvailability); 

bookingRoute.get('/for-guide', getGuideBookings);

 // Guide responds to booking
bookingRoute.patch('/guide/update-status/:bookingId', respondToBookingByGuide);

// bookingRoute.post('/addExp', addExperienceToBooking)

// get-all-booking for admin
bookingRoute.get('/get-all-booking', getAllBookings)

export default bookingRoute;
