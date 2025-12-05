import express from "express";
import { sendMessage, getMessages, getConversations, deleteMessage, editMessage } from "../controllers/chat.controllers.js";
import { isAuthenticated } from "../middleware/isAuth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.post("/send/:id", isAuthenticated, upload.single("media"), sendMessage);
router.get("/conversations", isAuthenticated, getConversations);
router.get("/:id", isAuthenticated, getMessages);
router.delete("/message/:id", isAuthenticated, deleteMessage);
router.put("/message/:id", isAuthenticated, editMessage);

export default router;
