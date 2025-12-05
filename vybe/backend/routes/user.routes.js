import express from "express";
import { upload } from "../config/cloudinary.js";
import { getCurrentUser, searchUser, followUser, updateProfile, getUserById, updateUserDetails } from "../controllers/user.controllers.js";
import { isAuthenticated } from "../middleware/isAuth.js";

const userRouter = express.Router();

userRouter.get("/me", isAuthenticated, getCurrentUser);
userRouter.get("/search", isAuthenticated, searchUser);
userRouter.get("/:id", isAuthenticated, getUserById);
userRouter.put("/follow/:id", isAuthenticated, followUser);
userRouter.put("/update-profile", isAuthenticated, upload.single("profileImg"), updateProfile);
userRouter.put("/update-details", isAuthenticated, updateUserDetails);

export default userRouter;