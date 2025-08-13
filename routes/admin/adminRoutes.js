import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import { getAllUser, getUserById, toggleBlockUser ,getBlockedUsers, deleteUser, getAllGuide, verifyGuide, revokeGuide, toggleBlockTour, getTourByGuide, getSingleTourByGuide, getBookingsByTour, getSingleBooking, adminDeleteReview } from "../../controllers/admin/adminController.js";


const adminRoute = Router()

adminRoute.use(userAuthCheck)

//user
adminRoute.get('/users',getAllUser)
adminRoute.get('/users/blockedUsers',getBlockedUsers)

//guide
adminRoute.get('/guide', getAllGuide)

adminRoute.patch('/deleteReview/:id', adminDeleteReview)
//path with id
adminRoute.get('/users/:id',getUserById)
adminRoute.patch('/users/block/:id', toggleBlockUser)
adminRoute.patch('/users/deleteUser/:id', deleteUser)

adminRoute.patch('/guides/verify/:id',verifyGuide)
adminRoute.patch('/guides/revoke/:id',revokeGuide)

adminRoute.patch('/tours/toggleBlock/:id',toggleBlockTour)
adminRoute.get('/tours/guide/:id', getTourByGuide)
adminRoute.get('/tours/guide/:guideId/tour/:tourId', getSingleTourByGuide)

adminRoute.get('/bookings/tour/:tourId', getBookingsByTour)
adminRoute.get('/bookings/:bookingId',getSingleBooking)

export default adminRoute