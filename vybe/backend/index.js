import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { ensureStoryTTLIndex } from "./utils/cleanupStories.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
dotenv.config();
import { app, server } from "./socket.js";

const port = 8002; // Hardcoded to avoid conflicts

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true,
}))
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

import postRouter from "./routes/post.routes.js";
import loopRouter from "./routes/loop.routes.js";
import storyRouter from "./routes/story.routes.js";
import chatRouter from "./routes/chat.routes.js";

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/post', postRouter);
app.use('/api/loop', loopRouter);
app.use('/api/story', storyRouter);
app.use('/api/chat', chatRouter);


server.listen(port, async () => {
    await connectDB();
    await ensureStoryTTLIndex(); // Ensure stories auto-delete after 24 hours
    console.log(`http://localhost:${port}`);
});


