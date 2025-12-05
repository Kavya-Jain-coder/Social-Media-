import React, { useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';
import { useNavigate } from 'react-router-dom';

const Create = () => {
    const [caption, setCaption] = useState("");
    const [file, setFile] = useState(null);
    const [type, setType] = useState("post"); // post, loop, story
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append("caption", caption);

        let endpoint = "";
        if (type === "post") {
            endpoint = `${serverUrl}/api/post/create`;
            formData.append("image", file);
        } else if (type === "loop") {
            endpoint = `${serverUrl}/api/loop/upload`;
            formData.append("video", file);
        } else if (type === "story") {
            endpoint = `${serverUrl}/api/story/create`;
            formData.append("media", file);
            formData.append("mediaType", file.type.startsWith('video') ? 'video' : 'image');
        }

        try {
            await axios.post(endpoint, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });
            alert("Created successfully!");
            navigate("/");
        } catch (error) {
            console.error("Error creating content:", error);
            alert("Failed to create content. Please try again.");
        }
    };

    return (
        <div className="flex justify-center items-center h-full p-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-md p-8 luxury-card">
                <div className="text-center mb-2">
                    <h2 className="text-2xl font-bold tracking-tight">Create New</h2>
                    <p className="text-gray-400 text-sm">Share your moments with the world</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Content Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="luxury-input appearance-none cursor-pointer"
                        >
                            <option value="post" className="bg-black text-white">Post</option>
                            <option value="loop" className="bg-black text-white">Reel (Loop)</option>
                            <option value="story" className="bg-black text-white">Story</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Upload Media</label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="luxury-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Caption</label>
                        <textarea
                            placeholder="Write a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="luxury-input h-32 resize-none"
                        />
                    </div>
                </div>

                <button type="submit" className="btn-luxury w-full mt-2">
                    Share
                </button>
            </form>
        </div>
    );
};

export default Create;
