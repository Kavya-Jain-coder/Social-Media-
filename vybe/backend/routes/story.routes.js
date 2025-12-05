import express from "express";
import { createStory, getStories, deleteStory, updateStory, viewStory } from "../controllers/story.controllers.js";
import { isAuthenticated } from "../middleware/isAuth.js";

import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.post("/create", isAuthenticated, upload.single("media"), createStory);
router.get("/feed", isAuthenticated, getStories);
router.delete("/:id", isAuthenticated, deleteStory);
router.put("/:id", isAuthenticated, updateStory);
router.put("/:id/view", isAuthenticated, viewStory);

export default router;
