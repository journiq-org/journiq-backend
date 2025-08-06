import { Router } from "express";
import { cancelBookingByUser, checkAvailability, createBooking, deleteBooking, getBookings, respondToBookingByGuide, updateBookingStatus } from "../../controllers/booking/bookingController.js";
import userAuthCheck from "../../middlewares/userAuthCheck.js";

const bookingRoute = Router();

bookingRoute.use(userAuthCheck)

bookingRoute.post('/create-booking', createBooking);
bookingRoute.get('/my-booking', getBookings );
bookingRoute.patch('/status/:id', updateBookingStatus);
bookingRoute.patch('/cancel/:bookingId', cancelBookingByUser);
bookingRoute.put('/respond/:bookingId', respondToBookingByGuide);
bookingRoute.patch('/delete/:bookingId' , deleteBooking),
bookingRoute.get('/checkAvailability', checkAvailability)



export default bookingRoute;
