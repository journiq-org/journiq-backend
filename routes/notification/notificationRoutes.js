import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import { deleteAllNotifications, deleteNotification, listAllNotifications, markAllAsRead, markAsRead, viewUnreadNotifications } from "../../controllers/notification/notificationController.js";


const notificationRoute = Router()

notificationRoute.use(userAuthCheck)


notificationRoute.get('/allNotification', listAllNotifications)
notificationRoute.get('/unread',viewUnreadNotifications)
notificationRoute.patch('/markAsRead/:notificationId',markAsRead)
notificationRoute.patch('/markAllAsRead',markAllAsRead)
notificationRoute.patch('/deleteNotification/:id',deleteNotification)
notificationRoute.patch('/deleteAll',deleteAllNotifications)

export default notificationRoute