import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    traveller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // traveller sending the message
      required: true,
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["unread", "read"], default: "unread" }, // ✅ comma added
    adminReply: { type: String }, // Admin reply
    repliedAt: { type: Date },     // When admin replied
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
