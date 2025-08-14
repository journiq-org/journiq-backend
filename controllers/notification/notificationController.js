import Notification from "../../models/Notification.js";
import HttpError from "../../middlewares/httpError.js";

//  List all notifications (not deleted)
export const listAllNotifications = async (req, res, next) => {
  try {
    const { user_id } = req.user_data;

    const notifications = await Notification.find({
      recipient: user_id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name")
      .populate("relatedTour", "title")
      .populate("relatedBooking", "status");

      if(notifications){

          res.status(200).json({ 
            status: true, 
            data: notifications
         });
      }
  } catch (err) {
    return next(new HttpError('Oops! Something went wrong'))
  }
};

//  View only unread notifications
export const viewUnreadNotifications = async (req, res, next) => {
  try {
    const { user_id } = req.user_data;

    const unread = await Notification.find({
      recipient: user_id,
      isRead: false,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name")
      .populate("relatedTour", "title")
      .populate("relatedBooking", "status");

      if(unread){
          res.status(200).json({ 
            status: true,
            data: unread ,
            message:null
        });

      }

  } catch (err) {
    return next(new HttpError('Oops! Something went wrong',500))
  }
};

//  Mark a specific notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const { user_id } = req.user_data;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: user_id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new HttpError("Notification not found", 404));
    }else{

        res.status(200).json({ 
            status: true, 
            message: "Notification marked as read", 
            data:notification });
    }

  } catch (err) {
    next(err);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    const { user_id } = req.user_data;

    await Notification.updateMany(
      { recipient: user_id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
         status: true, 
         message: "All notifications marked as read" 
        });
  } catch (err) {
   return next(new HttpError('Oops! Something went wrong', 500))
  }
};

//  Delete one notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user_data;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: user_id },
      { isDeleted: true },
      { new: true }
    );

    if (!notification) {
      return next(new HttpError("Notification not found", 404));
    }else{
        res.status(200).json({ 
            status: true, 
            message: "Notification deleted" 
        });

    }

  } catch (err) {
    return next(new HttpError('Oops! Something went wrong', 500))
  }
};

// Delete all notifications for a user
export const deleteAllNotifications = async (req, res, next) => {
  try {
    const { user_id } = req.user_data;

    await Notification.updateMany(
      { recipient: user_id },
      { isDeleted: true }
    );

    res.status(200).json({ 
        success: true, 
        message: "All notifications deleted" ,
        data: null
    });
  } catch (err) {
    return next(new HttpError('Oops! Something went wrong', 500))
  }
};