import express from "express";
import { createPost, getFeed, likePost, deletePost, addComment, deleteComment, getComments, updatePost } from "../controllers/post.controllers.js";
import { isAuthenticated } from "../middleware/isAuth.js";

import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.post("/create", isAuthenticated, upload.single("image"), createPost);
router.get("/feed", isAuthenticated, getFeed);
router.put("/like/:id", isAuthenticated, likePost);
router.delete("/:id", isAuthenticated, deletePost);
router.put("/:id", isAuthenticated, updatePost);

// Comment routes
router.post("/:id/comment", isAuthenticated, addComment);
router.get("/:id/comments", isAuthenticated, getComments);
router.delete("/:postId/comment/:commentId", isAuthenticated, deleteComment);

export default router;
