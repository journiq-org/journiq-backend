import { Router } from "express";
import {cancelBookingByUser, checkAvailability, createBooking, deleteBooking, getAllBookings, getBookings, getBookingsByTourId, getGuideBookings, respondToBookingByGuide, updateBookingStatus } from "../../controllers/booking/bookingController.js";
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

 // Guide responds to booking
bookingRoute.patch('/guide/update-status/:bookingId', respondToBookingByGuide);

// Admin deletes booking
bookingRoute.patch('/admin/delete-booking/:bookingId', deleteBooking); 

//  checks availability 
bookingRoute.get('/checkAvailability', checkAvailability); 

bookingRoute.get('/for-guide', getGuideBookings);

 // Guide responds to booking
bookingRoute.patch('/guide/update-status/:bookingId', respondToBookingByGuide);

// 

// get-all-booking for admin using tour id
bookingRoute.get('/get-booking/:tourId', getBookingsByTourId)


// get-all-booking 
bookingRoute.get('/admin/all',getAllBookings )

export default bookingRoute;
