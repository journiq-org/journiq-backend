import { Router } from "express";
import { cancelBookingByUser, checkAvailability, createBooking, deleteBooking, getBookings, respondToBookingByGuide, updateBookingStatus } from "../../controllers/booking/bookingController.js";
import userAuthCheck from "../../middlewares/userAuthCheck.js";

const bookingRoute = Router();

bookingRoute.use(userAuthCheck)

// create a new booking
bookingRoute.post('/create-booking', createBooking); 

// get all bookings of the user
bookingRoute.get('/my-booking', getBookings); 

// User confirms or changes status
bookingRoute.patch('/user/update-status/:id', updateBookingStatus); 

// User cancels booking
bookingRoute.patch('/cancel/:bookingId', cancelBookingByUser); 

 // Guide responds to booking
bookingRoute.put('/guide/update-status/:id', respondToBookingByGuide);

// Admin deletes booking
bookingRoute.patch('/admin/delete-booking/:bookingId', deleteBooking); 

//  checks availability 
bookingRoute.get('/checkAvailability', checkAvailability); 



export default bookingRoute;
