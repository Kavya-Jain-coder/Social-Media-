import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        const user = await User.findById(userId).populate("posts").populate("followers").populate("following").populate("loops").populate("stories");
        if (!user) {
            return res.status(400).json({
                message: "User not found!"
            })
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({
            message: `getCurrentUser error ${error}`
        })
    }
}

export const searchUser = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "Query is required" });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { name: { $regex: query, $options: "i" } }
            ]
        }).select("-password");

        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({
            message: `searchUser error ${error}`
        });
    }
}

export const followUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (id === userId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const userToFollow = await User.findById(id);
        const currentUser = await User.findById(userId);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (currentUser.following.includes(id)) {
            // Unfollow
            await currentUser.updateOne({ $pull: { following: id } });
            await userToFollow.updateOne({ $pull: { followers: userId } });
            res.status(200).json({ message: "Unfollowed user" });
        } else {
            // Follow
            await currentUser.updateOne({ $push: { following: id } });
            await userToFollow.updateOne({ $push: { followers: userId } });
            res.status(200).json({ message: "Followed user" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const profileImg = req.file?.path;

        if (!profileImg) {
            return res.status(400).json({ message: "Image is required" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profileImg },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id)
            .select("-password")
            .populate("posts")
            .populate("followers", "username name profileImg")
            .populate("following", "username name profileImg")
            .populate("loops");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `getUserById error: ${error}` });
    }
};

export const updateUserDetails = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, username, bio } = req.body;

        // Check if username is already taken by another user
        if (username) {
            const existingUser = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: "Username is already taken" });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                ...(name && { name }),
                ...(username && { username }),
                ...(bio !== undefined && { bio })
            },
            { new: true }
        ).select("-password")
            .populate("posts")
            .populate("followers")
            .populate("following")
            .populate("loops")
            .populate("stories");

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};