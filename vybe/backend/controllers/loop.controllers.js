import Loop from "../models/loop.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";

export const uploadLoop = async (req, res) => {
    try {
        const { caption } = req.body;
        const videoUrl = req.file?.path;
        const userId = req.userId;

        if (!videoUrl) {
            return res.status(400).json({ message: "Video is required" });
        }

        const newLoop = await Loop.create({
            author: userId,
            media: videoUrl,
            caption
        });

        await User.findByIdAndUpdate(userId, {
            $push: { loops: newLoop._id }
        });

        res.status(201).json(newLoop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateLoop = async (req, res) => {
    try {
        const { id } = req.params;
        const { caption } = req.body;
        const userId = req.userId;

        const loop = await Loop.findById(id);
        if (!loop) {
            return res.status(404).json({ message: "Reel not found" });
        }

        if (loop.author.toString() !== userId) {
            return res.status(403).json({ message: "You can only edit your own reels" });
        }

        loop.caption = caption;
        await loop.save();

        res.status(200).json(loop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLoops = async (req, res) => {
    try {
        const loops = await Loop.find()
            .populate("author", "username name profileImg followers")
            .populate({
                path: "comments",
                populate: { path: "author", select: "username name profileImg" }
            })
            .sort({ createdAt: -1 });
        res.status(200).json(loops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const likeLoop = async (req, res) => {
    try {
        const loopId = req.params.id;
        const userId = req.userId;

        const loop = await Loop.findById(loopId);
        if (!loop) return res.status(404).json({ message: "Loop not found" });

        if (loop.likes.includes(userId)) {
            await loop.updateOne({ $pull: { likes: userId } });
            res.status(200).json({ message: "Loop unliked" });
        } else {
            await loop.updateOne({ $push: { likes: userId } });
            res.status(200).json({ message: "Loop liked" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteLoop = async (req, res) => {
    try {
        const loopId = req.params.id;
        const userId = req.userId;

        const loop = await Loop.findById(loopId);
        if (!loop) return res.status(404).json({ message: "Loop not found" });

        if (loop.author.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own reels" });
        }

        // Delete all comments associated with this loop
        await Comment.deleteMany({ loop: loopId });
        await Loop.findByIdAndDelete(loopId);
        await User.findByIdAndUpdate(userId, { $pull: { loops: loopId } });

        res.status(200).json({ message: "Reel deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addComment = async (req, res) => {
    try {
        const loopId = req.params.id;
        const userId = req.userId;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const loop = await Loop.findById(loopId);
        if (!loop) return res.status(404).json({ message: "Loop not found" });

        const newComment = await Comment.create({
            author: userId,
            content: content.trim(),
            loop: loopId
        });

        await Loop.findByIdAndUpdate(loopId, {
            $push: { comments: newComment._id }
        });

        const populatedComment = await Comment.findById(newComment._id)
            .populate("author", "username name profileImg");

        res.status(201).json(populatedComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getComments = async (req, res) => {
    try {
        const loopId = req.params.id;

        const comments = await Comment.find({ loop: loopId })
            .populate("author", "username name profileImg")
            .sort({ createdAt: -1 });

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.userId;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        if (comment.author.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own comments" });
        }

        await Loop.findByIdAndUpdate(comment.loop, {
            $pull: { comments: commentId }
        });
        await Comment.findByIdAndDelete(commentId);

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
