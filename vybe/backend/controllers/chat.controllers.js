import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket.js";

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.userId;

        // Handle media upload
        const media = req.file?.path || null;
        let mediaType = null;
        if (req.file) {
            mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        }

        // Validate that there's either a message or media
        if (!message && !media) {
            return res.status(400).json({ error: "Message or media is required" });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message: message || "",
            media,
            mediaType,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([conversation.save(), newMessage.save()]);

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.userId;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages");

        if (!conversation) return res.status(200).json([]);

        const messages = conversation.messages;

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getConversations = async (req, res) => {
    try {
        const userId = req.userId;
        const conversations = await Conversation.find({
            participants: userId
        }).populate("participants", "username name profileImg");

        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        console.log("Delete request - Message ID:", id, "User ID:", userId);

        const message = await Message.findById(id);
        if (!message) {
            console.log("Message not found:", id);
            return res.status(404).json({ error: "Message not found" });
        }

        console.log("Message senderId:", message.senderId.toString(), "vs userId:", userId);

        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ error: "You can only delete your own messages" });
        }

        await Message.findByIdAndDelete(id);
        console.log("Message deleted successfully:", id);

        // Emit socket event for real-time deletion
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", id);
        }

        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Delete message error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message: newContent } = req.body;
        const userId = req.userId;

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ error: "Message not found" });

        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ error: "You can only edit your own messages" });
        }

        message.message = newContent;
        await message.save();

        // Emit socket event for real-time update
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageUpdated", message);
        }

        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
