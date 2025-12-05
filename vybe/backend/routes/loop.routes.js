import express from "express";
import { uploadLoop, getLoops, likeLoop, deleteLoop, addComment, getComments, deleteComment, updateLoop } from "../controllers/loop.controllers.js";
import { isAuthenticated } from "../middleware/isAuth.js";

import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.post("/upload", isAuthenticated, upload.single("video"), uploadLoop);
router.get("/feed", isAuthenticated, getLoops);
router.put("/like/:id", isAuthenticated, likeLoop);
router.delete("/:id", isAuthenticated, deleteLoop);
router.put("/:id", isAuthenticated, updateLoop);
router.post("/:id/comment", isAuthenticated, addComment);
router.get("/:id/comments", isAuthenticated, getComments);
router.delete("/:id/comment/:commentId", isAuthenticated, deleteComment);

export default router;
