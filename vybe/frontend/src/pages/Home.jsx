import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';
import { FaRegHeart, FaHeart, FaRegComment, FaRegPaperPlane, FaRegBookmark, FaTimes } from 'react-icons/fa';
import { IoClose, IoHeartOutline, IoShareSocialOutline, IoTrashOutline, IoSend } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DefaultAvatar from '../components/DefaultAvatar';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [stories, setStories] = useState([]);
    const [viewingStories, setViewingStories] = useState(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [commentModal, setCommentModal] = useState(null); // Post to show comments for
    const [shareModal, setShareModal] = useState(null); // Post to share
    const [newComment, setNewComment] = useState("");
    const [followers, setFollowers] = useState([]);
    const [storyFile, setStoryFile] = useState(null);
    const [storyPreview, setStoryPreview] = useState(null);
    const [storyCaption, setStoryCaption] = useState("");
    const [editingPost, setEditingPost] = useState(null);
    const [editCaption, setEditCaption] = useState("");
    const [storyMessage, setStoryMessage] = useState("");
    const [showStoryShareModal, setShowStoryShareModal] = useState(false);
    const fileInputRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchFeed = async () => {
        try {
            const res = await axios.get(`${serverUrl}/api/post/feed`, { withCredentials: true });
            setPosts(res.data);
        } catch (error) {
            console.error("Error fetching feed:", error);
        }
    };

    const fetchStories = async () => {
        try {
            const res = await axios.get(`${serverUrl}/api/story/feed`, { withCredentials: true });
            setStories(res.data);
        } catch (error) {
            console.error("Error fetching stories:", error);
        }
    };

    const fetchFollowers = async () => {
        try {
            const res = await axios.get(`${serverUrl}/api/user/me`, { withCredentials: true });
            setFollowers(res.data.following || []);
        } catch (error) {
            console.error("Error fetching followers:", error);
        }
    };

    useEffect(() => {
        if (viewingStories && viewingStories[currentStoryIndex] && user && viewingStories[currentStoryIndex].author?._id !== user._id) {
            axios.put(`${serverUrl}/api/story/${viewingStories[currentStoryIndex]._id}/view`, {}, { withCredentials: true })
                .catch(err => console.error("Error viewing story:", err));
        }
    }, [viewingStories, currentStoryIndex, user]);

    useEffect(() => {
        fetchFeed();
        fetchStories();
        fetchFollowers();
    }, []);

    const handleStoryUpload = async () => {
        if (!storyFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("media", storyFile);
        formData.append("mediaType", storyFile.type.startsWith('video') ? 'video' : 'image');
        formData.append("caption", storyCaption);

        try {
            await axios.post(`${serverUrl}/api/story/create`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });

            fetchStories();
            setStoryFile(null);
            setStoryPreview(null);
            setStoryCaption("");
        } catch (error) {
            console.error("Error uploading story:", error);
            alert("Failed to upload story");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteStory = async (storyId) => {
        try {
            await axios.delete(`${serverUrl}/api/story/${storyId}`, { withCredentials: true });
            await axios.delete(`${serverUrl}/api/story/${storyId}`, { withCredentials: true });
            if (viewingStories.length > 1) {
                setViewingStories(prev => prev.filter(s => s._id !== storyId));
                if (currentStoryIndex >= viewingStories.length - 1) {
                    setCurrentStoryIndex(prev => Math.max(0, prev - 1));
                }
            } else {
                setViewingStories(null);
                setCurrentStoryIndex(0);
            }
            fetchStories();
        } catch (error) {
            console.error("Error deleting story:", error);
            alert("Failed to delete story");
        }
    };

    const handleLikePost = async (postId) => {
        try {
            await axios.put(`${serverUrl}/api/post/like/${postId}`, {}, { withCredentials: true });
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    const isLiked = post.likes.includes(user._id);
                    return {
                        ...post,
                        likes: isLiked ? post.likes.filter(id => id !== user._id) : [...post.likes, user._id]
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const handleAddComment = async (postId) => {
        if (!newComment.trim()) return;

        try {
            const res = await axios.post(`${serverUrl}/api/post/${postId}/comment`,
                { text: newComment },
                { withCredentials: true }
            );

            // Update the post with new comments
            setPosts(posts.map(post =>
                post._id === postId ? res.data : post
            ));
            setCommentModal(res.data);
            setNewComment("");
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("Failed to add comment");
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            await axios.delete(`${serverUrl}/api/post/${postId}/comment/${commentId}`, { withCredentials: true });

            // Update the post by removing the comment
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        comments: post.comments.filter(c => c._id !== commentId)
                    };
                }
                return post;
            }));

            // Also update the modal
            if (commentModal && commentModal._id === postId) {
                setCommentModal(prev => ({
                    ...prev,
                    comments: prev.comments.filter(c => c._id !== commentId)
                }));
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const handleShareToUser = async (userId, post) => {
        try {
            // Send the post as a message directly to the user
            const message = `Check out this post!\n\n📸 ${post.author?.username}: ${post.caption || ''}\n\n🔗 ${window.location.origin}/post/${post._id}`;

            await axios.post(`${serverUrl}/api/chat/send/${userId}`,
                { message },
                { withCredentials: true }
            );

            alert(`Post shared successfully!`);
            setShareModal(null);
        } catch (error) {
            console.error("Error sharing post:", error);
            alert("Failed to share post");
        }
    };

    const handleUpdatePost = async () => {
        if (!editingPost || !editCaption.trim()) return;

        try {
            const res = await axios.put(`${serverUrl}/api/post/${editingPost._id}`,
                { caption: editCaption },
                { withCredentials: true }
            );

            setPosts(posts.map(post =>
                post._id === editingPost._id ? { ...post, caption: editCaption } : post
            ));
            setEditingPost(null);
            setEditCaption("");
        } catch (error) {
            console.error("Error updating post:", error);
            alert("Failed to update post");
        }
    };

    const handleSendStoryReply = async () => {
        if (!storyMessage.trim() || !viewingStories?.[currentStoryIndex]) return;

        try {
            const story = viewingStories[currentStoryIndex];
            const message = `Replied to your story: "${story.caption || '📸'}"\n\n${storyMessage}`;

            await axios.post(`${serverUrl}/api/chat/send/${story.author._id}`,
                { message },
                { withCredentials: true }
            );

            setStoryMessage("");
            alert("Reply sent!");
        } catch (error) {
            console.error("Error sending story reply:", error);
            alert("Failed to send reply");
        }
    };

    const handleLikeStory = async () => {
        if (!viewingStories?.[currentStoryIndex]) return;

        try {
            const story = viewingStories[currentStoryIndex];
            const message = `❤️ Liked your story${story.caption ? `: "${story.caption}"` : ''}`;

            await axios.post(`${serverUrl}/api/chat/send/${story.author._id}`,
                { message },
                { withCredentials: true }
            );

            alert("Reaction sent!");
        } catch (error) {
            console.error("Error liking story:", error);
        }
    };

    const handleShareStoryToUser = async (userId) => {
        if (!viewingStories?.[currentStoryIndex]) return;

        try {
            const story = viewingStories[currentStoryIndex];
            const message = `Check out this story by @${story.author.username}!\n\n📸 ${story.caption || 'No caption'}`;

            await axios.post(`${serverUrl}/api/chat/send/${userId}`,
                { message },
                { withCredentials: true }
            );

            alert("Story shared!");
            setShowStoryShareModal(false);
        } catch (error) {
            console.error("Error sharing story:", error);
            alert("Failed to share story");
        }
    };

    const handleCopyLink = (post) => {
        const link = `${window.location.origin}/post/${post._id}`;
        navigator.clipboard.writeText(link);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="w-full pt-6 pb-10 px-4 md:px-0 relative">

            {/* Message Button - Floating */}
            <button
                onClick={() => navigate("/chat")}
                className="fixed top-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full shadow-lg shadow-purple-500/30 hover:scale-110 transition-transform"
            >
                <FaRegPaperPlane size={20} className="text-white" />
            </button>

            {/* Stories Section */}
            <div className="mb-8 max-w-lg mx-auto mt-4">
                <div className="overflow-x-auto scrollbar-hide py-2">
                    <div className="flex gap-4 px-2">
                        {/* Add Story */}
                        <div
                            className="flex flex-col items-center gap-2 cursor-pointer min-w-[80px]"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div className={`w-[74px] h-[74px] rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-[#18181b] hover:bg-[#27272a] transition-colors ${isUploading ? 'animate-pulse' : ''}`}>
                                <span className="text-3xl text-white font-light">{isUploading ? '...' : '+'}</span>
                            </div>
                            <span className="text-xs text-white font-medium">Your story</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setStoryFile(file);
                                        setStoryPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </div>

                        {/* Grouped Story Items */}
                        {Object.values(stories.reduce((acc, story) => {
                            const authorId = story.author._id;
                            if (!acc[authorId]) {
                                acc[authorId] = {
                                    author: story.author,
                                    stories: []
                                };
                            }
                            acc[authorId].stories.push(story);
                            return acc;
                        }, {})).map((group) => (
                            <div
                                key={group.author._id}
                                className="flex flex-col items-center gap-2 cursor-pointer min-w-[80px] group"
                                onClick={() => {
                                    setViewingStories(group.stories);
                                    setCurrentStoryIndex(0);
                                }}
                            >
                                <div className="w-[74px] h-[74px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 group-hover:scale-105 transition-transform duration-300">
                                    <div className="w-full h-full rounded-full p-[2px] bg-black flex items-center justify-center">
                                        {group.author?.profileImg ? (
                                            <img
                                                src={group.author.profileImg}
                                                alt="story"
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <DefaultAvatar name={group.author?.name} username={group.author?.username} size="2xl" />
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-white font-medium truncate w-20 text-center">{group.author?.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Story Upload Modal */}
            {storyFile && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-white font-bold">New Story</h3>
                            <button onClick={() => { setStoryFile(null); setStoryPreview(null); setStoryCaption(""); }} className="text-white">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-center bg-black">
                            {storyFile.type.startsWith('video') ? (
                                <video src={storyPreview} className="max-h-[60vh] object-contain" controls />
                            ) : (
                                <img src={storyPreview} alt="preview" className="max-h-[60vh] object-contain" />
                            )}
                        </div>
                        <div className="p-4">
                            <input
                                type="text"
                                placeholder="Add a caption..."
                                value={storyCaption}
                                onChange={(e) => setStoryCaption(e.target.value)}
                                className="w-full bg-transparent border-b border-white/30 py-2 text-white outline-none focus:border-white mb-4"
                            />
                            <button
                                onClick={handleStoryUpload}
                                disabled={isUploading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                                {isUploading ? "Uploading..." : "Share to Story"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed Section */}
            <div className="flex flex-col gap-6 max-w-lg mx-auto pb-20">
                {posts.map((post) => (
                    <div key={post._id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
                        {/* Post Header */}
                        <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {post.author?.profileImg ? (
                                    <img
                                        src={post.author.profileImg}
                                        alt="user"
                                        className="w-9 h-9 rounded-full object-cover border border-white/10"
                                    />
                                ) : (
                                    <DefaultAvatar name={post.author?.name} username={post.author?.username} size="md" className="border border-white/10" />
                                )}
                                <div>
                                    <p className="font-semibold text-sm text-white">{post.author?.username}</p>
                                </div>
                            </div>
                            {user?._id === post.author?._id && (
                                <button
                                    onClick={() => { setEditingPost(post); setEditCaption(post.caption || ""); }}
                                    className="text-gray-400 hover:text-white text-xs font-medium px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {/* Post Image */}
                        <div className="w-full aspect-square bg-[#09090b]">
                            <img
                                src={post.media}
                                alt="post"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Post Actions */}
                        <div className="p-3">
                            <div className="flex items-center gap-5 mb-3">
                                <button
                                    onClick={() => handleLikePost(post._id)}
                                    className={`${post.likes.includes(user?._id) ? 'text-red-500' : 'text-white'} hover:scale-110 transition-transform`}
                                >
                                    {post.likes.includes(user?._id) ? <FaHeart size={24} /> : <FaRegHeart size={24} />}
                                </button>
                                <button
                                    onClick={() => setCommentModal(post)}
                                    className="text-white hover:text-gray-300 hover:scale-110 transition-transform"
                                >
                                    <FaRegComment size={24} />
                                </button>
                                <button
                                    onClick={() => setShareModal(post)}
                                    className="text-white hover:text-gray-300 hover:scale-110 transition-transform"
                                >
                                    <FaRegPaperPlane size={24} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">{post.likes.length} likes</p>
                                <p className="text-sm text-[#e4e4e7]">
                                    <span className="font-bold text-white mr-2">{post.author?.username}</span>
                                    {post.caption}
                                </p>
                                <button
                                    onClick={() => setCommentModal(post)}
                                    className="text-sm text-[#71717a] mt-1 hover:text-gray-400"
                                >
                                    View all {post.comments?.length || 0} comments
                                </button>
                                <p className="text-[10px] text-[#71717a] uppercase tracking-wide mt-1">{new Date(post.createdAt).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comment Modal */}
            {commentModal && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Comments</h3>
                            <button
                                onClick={() => setCommentModal(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <FaTimes className="text-white" size={20} />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {commentModal.comments?.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <p>No comments yet</p>
                                    <p className="text-sm mt-1">Be the first to comment!</p>
                                </div>
                            ) : (
                                commentModal.comments?.map((comment) => (
                                    <div key={comment._id} className="flex gap-3 group">
                                        <div className="shrink-0">
                                            {comment.user?.profileImg ? (
                                                <img src={comment.user.profileImg} className="w-9 h-9 rounded-full object-cover" />
                                            ) : (
                                                <DefaultAvatar name={comment.user?.name} username={comment.user?.username} size="md" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-white">
                                                <span className="font-bold mr-2">{comment.user?.username}</span>
                                                {comment.text}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {(comment.user?._id === user?._id || commentModal.author?._id === user?._id) && (
                                            <button
                                                onClick={() => handleDeleteComment(commentModal._id, comment._id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-all"
                                            >
                                                <IoTrashOutline size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Comment */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                {user?.profileImg ? (
                                    <img src={user.profileImg} className="w-9 h-9 rounded-full object-cover" />
                                ) : (
                                    <DefaultAvatar name={user?.name} username={user?.username} size="md" />
                                )}
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(commentModal._id)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                                />
                                <button
                                    onClick={() => handleAddComment(commentModal._id)}
                                    disabled={!newComment.trim()}
                                    className={`font-semibold ${newComment.trim() ? 'text-blue-500 hover:text-blue-400' : 'text-gray-600'}`}
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {shareModal && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Share Post</h3>
                            <button
                                onClick={() => setShareModal(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <FaTimes className="text-white" size={20} />
                            </button>
                        </div>

                        {/* Copy Link */}
                        <div className="p-4 border-b border-white/10">
                            <button
                                onClick={() => handleCopyLink(shareModal)}
                                className="w-full flex items-center justify-center gap-3 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                                <span className="text-white font-semibold">Copy Link</span>
                            </button>
                        </div>

                        {/* Share to Followers */}
                        <div className="p-4">
                            <p className="text-gray-400 text-sm mb-4">Send to</p>
                            <div className="max-h-[300px] overflow-y-auto space-y-3">
                                {followers.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">No followers to share with</p>
                                ) : (
                                    followers.map((follower) => (
                                        <div key={follower._id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {follower.profileImg ? (
                                                    <img src={follower.profileImg} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <DefaultAvatar name={follower.name} username={follower.username} size="lg" />
                                                )}
                                                <div>
                                                    <p className="font-semibold text-sm text-white">{follower.username}</p>
                                                    <p className="text-xs text-gray-500">{follower.name}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleShareToUser(follower._id, shareModal)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )
            }

            {/* Edit Post Modal */}
            {
                editingPost && (
                    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-white font-bold">Edit Post</h3>
                                <button onClick={() => setEditingPost(null)} className="text-white">
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="p-4">
                                <textarea
                                    value={editCaption}
                                    onChange={(e) => setEditCaption(e.target.value)}
                                    className="w-full bg-transparent border border-white/30 rounded-xl p-3 text-white outline-none focus:border-white min-h-[100px]"
                                    placeholder="Write a caption..."
                                />
                                <button
                                    onClick={handleUpdatePost}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold mt-4 transition-colors"
                                >
                                    Update Post
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Story Viewer Full Screen Overlay */}
            {
                viewingStories && viewingStories[currentStoryIndex] && (
                    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
                        {/* Story Navigation Zones */}
                        <div
                            className="absolute inset-y-0 left-0 w-1/3 z-40"
                            onClick={() => {
                                if (currentStoryIndex > 0) {
                                    setCurrentStoryIndex(prev => prev - 1);
                                } else {
                                    setViewingStories(null);
                                }
                            }}
                        ></div>
                        <div
                            className="absolute inset-y-0 right-0 w-1/3 z-40"
                            onClick={() => {
                                if (currentStoryIndex < viewingStories.length - 1) {
                                    setCurrentStoryIndex(prev => prev + 1);
                                } else {
                                    setViewingStories(null);
                                }
                            }}
                        ></div>

                        {/* Progress Bar Segmented */}
                        <div className="absolute top-0 left-0 w-full flex gap-1 p-2 z-50">
                            {viewingStories.map((_, idx) => (
                                <div key={idx} className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-white transition-all duration-300 ${idx < currentStoryIndex ? 'w-full' :
                                            idx === currentStoryIndex ? 'w-full animate-[progress_5s_linear]' : 'w-0'
                                            }`}
                                    ></div>
                                </div>
                            ))}
                        </div>

                        {/* Header */}
                        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
                            <div className="flex items-center gap-3 pointer-events-auto">
                                <img
                                    src={viewingStories[currentStoryIndex].author?.profileImg || "https://via.placeholder.com/150"}
                                    alt="user"
                                    className="w-8 h-8 rounded-full border border-white/20"
                                />
                                <span className="text-white font-semibold text-sm shadow-black drop-shadow-md">{viewingStories[currentStoryIndex].author?.username}</span>
                                <span className="text-gray-400 text-xs">• {new Date(viewingStories[currentStoryIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <button
                                onClick={() => setViewingStories(null)}
                                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
                            >
                                <IoClose size={28} />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-center bg-black relative">
                            {viewingStories[currentStoryIndex].mediaType === 'video' ? (
                                <video
                                    key={viewingStories[currentStoryIndex]._id}
                                    src={viewingStories[currentStoryIndex].media}
                                    className="w-full h-full object-contain max-h-[90vh]"
                                    autoPlay
                                    playsInline
                                    controls={false}
                                />
                            ) : (
                                <img
                                    key={viewingStories[currentStoryIndex]._id}
                                    src={viewingStories[currentStoryIndex].media}
                                    alt="story"
                                    className="w-full h-full object-contain max-h-[90vh]"
                                />
                            )}
                        </div>

                        {/* Caption Overlay */}
                        {viewingStories[currentStoryIndex].caption && (
                            <div className="absolute bottom-20 left-0 w-full p-4 z-50 text-center pointer-events-none">
                                <p className="text-white text-lg font-medium drop-shadow-md bg-black/30 inline-block px-4 py-2 rounded-xl backdrop-blur-sm">
                                    {viewingStories[currentStoryIndex].caption}
                                </p>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent z-50 pointer-events-auto">
                            <div className="flex items-center gap-4 max-w-lg mx-auto">
                                {/* Only show message input if NOT your own story */}
                                {String(user?._id) !== String(viewingStories[currentStoryIndex].author?._id) ? (
                                    <>
                                        <input
                                            type="text"
                                            value={storyMessage}
                                            onChange={(e) => setStoryMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendStoryReply()}
                                            placeholder="Send message..."
                                            className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-3 text-white placeholder-white/70 focus:border-white outline-none backdrop-blur-sm"
                                        />
                                        {storyMessage.trim() ? (
                                            <button
                                                onClick={handleSendStoryReply}
                                                className="text-blue-500 hover:scale-110 transition-transform"
                                            >
                                                <IoSend size={28} />
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleLikeStory}
                                                    className="text-white hover:text-red-500 hover:scale-110 transition-all"
                                                >
                                                    <IoHeartOutline size={28} />
                                                </button>
                                                <button
                                                    onClick={() => setShowStoryShareModal(true)}
                                                    className="text-white hover:scale-110 transition-transform"
                                                >
                                                    <IoShareSocialOutline size={28} />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    /* Show delete button and viewers count for your own story */
                                    <div className="flex-1 flex items-center justify-between">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Toggle viewers modal - we'll add state for this
                                                const viewersModal = document.getElementById('viewers-modal');
                                                if (viewersModal) viewersModal.classList.toggle('hidden');
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-sm font-medium">{viewingStories[currentStoryIndex].viewers?.length || 0}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Delete this story?")) {
                                                    handleDeleteStory(viewingStories[currentStoryIndex]._id);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full transition-all"
                                        >
                                            <IoTrashOutline size={20} />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Viewers Modal - Only for own story */}
                        {String(user?._id) === String(viewingStories[currentStoryIndex].author?._id) && (
                            <div
                                id="viewers-modal"
                                className="hidden fixed inset-0 z-[250] flex items-end justify-center"
                                onClick={(e) => {
                                    if (e.target.id === 'viewers-modal') {
                                        e.target.classList.add('hidden');
                                    }
                                }}
                            >
                                <div className="absolute inset-0 bg-black/60" />
                                <div className="relative w-full max-w-lg bg-[#18181b] rounded-t-3xl max-h-[60vh] overflow-hidden animate-slide-up">
                                    <div className="sticky top-0 bg-[#18181b] border-b border-white/10 p-4 flex items-center justify-between">
                                        <h4 className="text-white font-bold text-lg">Viewers</h4>
                                        <button
                                            onClick={() => document.getElementById('viewers-modal')?.classList.add('hidden')}
                                            className="text-gray-400 hover:text-white p-1"
                                        >
                                            <IoClose size={24} />
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto max-h-[50vh]">
                                        {viewingStories[currentStoryIndex].viewers?.length > 0 ? (
                                            <div className="space-y-4">
                                                {viewingStories[currentStoryIndex].viewers.map(viewer => (
                                                    <div key={viewer._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                                                        {viewer.profileImg ? (
                                                            <img src={viewer.profileImg} alt={viewer.username} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                                        ) : (
                                                            <DefaultAvatar name={viewer.name} username={viewer.username} size="lg" />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="text-white font-semibold">{viewer.username}</p>
                                                            <p className="text-gray-400 text-sm">{viewer.name}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-600 mb-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <p className="text-gray-500">No viewers yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Story Share Modal */}
            {showStoryShareModal && viewingStories?.[currentStoryIndex] && (
                <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Share Story</h3>
                            <button
                                onClick={() => setShowStoryShareModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <FaTimes className="text-white" size={20} />
                            </button>
                        </div>

                        {/* Share to Followers */}
                        <div className="p-4">
                            <p className="text-gray-400 text-sm mb-4">Send to</p>
                            <div className="max-h-[300px] overflow-y-auto space-y-3">
                                {followers.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">No followers to share with</p>
                                ) : (
                                    followers.map((follower) => (
                                        <div key={follower._id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {follower.profileImg ? (
                                                    <img src={follower.profileImg} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <DefaultAvatar name={follower.name} username={follower.username} size="lg" />
                                                )}
                                                <div>
                                                    <p className="font-semibold text-sm text-white">{follower.username}</p>
                                                    <p className="text-xs text-gray-500">{follower.name}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleShareStoryToUser(follower._id)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;

