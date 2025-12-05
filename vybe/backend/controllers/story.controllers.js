import Story from "../models/story.model.js";
import User from "../models/user.model.js";

export const createStory = async (req, res) => {
    try {
        const { mediaType = "image", caption } = req.body;
        const media = req.file?.path;
        const userId = req.userId;

        if (!media) {
            return res.status(400).json({ message: "Media file is required" });
        }

        const newStory = await Story.create({
            author: userId,
            media,
            mediaType,
            caption
        });

        await User.findByIdAndUpdate(userId, {
            $push: { stories: newStory._id }
        });

        res.status(201).json(newStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateStory = async (req, res) => {
    try {
        const { id } = req.params;
        const { caption } = req.body;
        const userId = req.userId;

        const story = await Story.findById(id);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (story.author.toString() !== userId) {
            return res.status(403).json({ message: "You can only edit your own stories" });
        }

        story.caption = caption;
        await story.save();

        res.status(200).json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStories = async (req, res) => {
    try {
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const stories = await Story.find({
            createdAt: { $gt: twentyFourHoursAgo }
        })
            .populate("author", "username name profileImg")
            .populate("viewers", "username name profileImg");

        res.status(200).json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const story = await Story.findById(id);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        // Check if user is the owner
        if (story.author.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own stories" });
        }

        await Story.findByIdAndDelete(id);
        await User.findByIdAndUpdate(userId, {
            $pull: { stories: id }
        });

        res.status(200).json({ message: "Story deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const viewStory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const story = await Story.findById(id);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (!story.viewers.includes(userId)) {
            story.viewers.push(userId);
            await story.save();
        }

        res.status(200).json({ message: "Story viewed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
