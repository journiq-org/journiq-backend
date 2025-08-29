import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import {
  sendMessage,
  getAllMessages,
  markAsRead,
  getTravellerMessages,
  replyToMessage,
} from "../../controllers/message/messageController.js";

const messageRoute = Router();

messageRoute.use(userAuthCheck);

messageRoute.post("/send", sendMessage);
messageRoute.get("/all", getAllMessages);
messageRoute.patch("/markAsRead/:id", markAsRead);
messageRoute.get("/myMessages", getTravellerMessages);
// Admin replies to message
messageRoute.patch("/reply/:id", replyToMessage);

export default messageRoute;
