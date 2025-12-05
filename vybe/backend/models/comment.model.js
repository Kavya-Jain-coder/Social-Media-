import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        maxLength: 500
    },
    loop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loop"
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
