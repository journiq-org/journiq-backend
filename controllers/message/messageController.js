import Message from "../../models/Message.js";
import HttpError from '../../middlewares/httpError.js'

// Traveller sends a message
export const sendMessage = async (req, res, next) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return next(new HttpError("Subject and message are required", 422));
    }

    const newMessage = new Message({
      traveller: req.user_data.user_id,
      subject,
      message,
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    next(new HttpError(error.message, 500));
  }
};

// Traveller views their messages
export const getTravellerMessages = async (req, res, next) => {
  try {
    const travellerId = req.user_data.user_id;

    const messages = await Message.find({ traveller: travellerId })
      .sort({ createdAt: 1 }); // oldest first for chat view

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(new HttpError(error.message, 500));
  }
};


// Admin views all messages
export const getAllMessages = async (req, res, next) => {
  try {
    if (req.user_data.user_role !== "admin") {
      return next(new HttpError("Access denied", 403));
    }

    const messages = await Message.find()
      .populate("traveller", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(new HttpError(error.message, 500));
  }
};


// Admin marks message as read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const msg = await Message.findById(id);

    if (!msg) return next(new HttpError("Message not found", 404));

    msg.status = "read";
    await msg.save();

    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    next(new HttpError(error.message, 500));
  }
};

// Admin replies to a traveller message
export const replyToMessage = async (req, res, next) => {
  try {
     if (req.user_data.user_role !== "admin")  {
      return next(new HttpError("Access denied", 403));
    }

    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) return next(new HttpError("Reply message is required", 422));

    const msg = await Message.findById(id);
    if (!msg) return next(new HttpError("Message not found", 404));

    msg.adminReply = reply;
    msg.repliedAt = Date.now();
    msg.status = "read";

    await msg.save();

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: msg,
    });
  } catch (error) {
    next(new HttpError(error.message, 500));
  }
};

