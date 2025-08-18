import { Router } from "express";
import { addExperienceToBooking, cancelBookingByUser, checkAvailability, createBooking, deleteBooking, getBookings, respondToBookingByGuide, updateBookingStatus } from "../../controllers/booking/bookingController.js";
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
<<<<<<< Updated upstream
bookingRoute.put('/guide/update-status/:bookingId', respondToBookingByGuide);
=======
bookingRoute.patch('/guide/update-status/:id', respondToBookingByGuide);
>>>>>>> Stashed changes

// Admin deletes booking
bookingRoute.patch('/admin/delete-booking/:bookingId', deleteBooking); 

//  checks availability 
bookingRoute.get('/checkAvailability', checkAvailability); 

// bookingRoute.post('/addExp', addExperienceToBooking)



export default bookingRoute;
