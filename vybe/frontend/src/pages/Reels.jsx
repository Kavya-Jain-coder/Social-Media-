import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';
import { FaHeart, FaComment, FaShare, FaTrash, FaTimes, FaPaperPlane, FaPlay } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import DefaultAvatar from '../components/DefaultAvatar';

const Reels = () => {
    const [loops, setLoops] = useState([]);
    const [muted, setMuted] = useState(true);
    const [paused, setPaused] = useState({});
    const [showComments, setShowComments] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [showShareModal, setShowShareModal] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [selectedFollowers, setSelectedFollowers] = useState([]);
    const [loadingFollowers, setLoadingFollowers] = useState(false);
    const [sendingShare, setSendingShare] = useState(false);
    const videoRefs = useRef({});
    const { user } = useAuth();

    useEffect(() => {
        const fetchLoops = async () => {
            try {
                const res = await axios.get(`${serverUrl}/api/loop/feed`, { withCredentials: true });
                setLoops(res.data);
            } catch (error) {
                console.error("Error fetching loops:", error);
            }
        };
        fetchLoops();
    }, []);

    const handleFollow = async (userId) => {
        try {
            await axios.put(`${serverUrl}/api/user/follow/${userId}`, {}, { withCredentials: true });
            setLoops(loops.map(loop => {
                if (loop.author._id === userId) {
                    const isFollowing = loop.author.followers?.includes(user._id);
                    return {
                        ...loop,
                        author: {
                            ...loop.author,
                            followers: isFollowing
                                ? loop.author.followers.filter(id => id !== user._id)
                                : [...(loop.author.followers || []), user._id]
                        }
                    };
                }
                return loop;
            }));
        } catch (error) {
            console.error("Error following user:", error);
        }
    };

    const handleLike = async (loopId) => {
        try {
            await axios.put(`${serverUrl}/api/loop/like/${loopId}`, {}, { withCredentials: true });
            setLoops(loops.map(loop => {
                if (loop._id === loopId) {
                    const isLiked = loop.likes?.includes(user._id);
                    return {
                        ...loop,
                        likes: isLiked
                            ? loop.likes.filter(id => id !== user._id)
                            : [...(loop.likes || []), user._id]
                    };
                }
                return loop;
            }));
        } catch (error) {
            console.error("Error liking loop:", error);
        }
    };

    const handleDelete = async (loopId) => {
        if (!window.confirm("Delete this reel?")) return;
        try {
            await axios.delete(`${serverUrl}/api/loop/${loopId}`, { withCredentials: true });
            setLoops(loops.filter(loop => loop._id !== loopId));
        } catch (error) {
            console.error("Error deleting loop:", error);
        }
    };

    const openComments = async (loopId) => {
        setShowComments(loopId);
        setLoadingComments(true);
        try {
            const res = await axios.get(`${serverUrl}/api/loop/${loopId}/comments`, { withCredentials: true });
            setComments(res.data);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const closeComments = () => {
        setShowComments(null);
        setComments([]);
        setNewComment("");
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !showComments) return;

        try {
            const res = await axios.post(`${serverUrl}/api/loop/${showComments}/comment`, {
                content: newComment
            }, { withCredentials: true });

            setComments([res.data, ...comments]);
            setNewComment("");

            setLoops(loops.map(loop => {
                if (loop._id === showComments) {
                    return {
                        ...loop,
                        comments: [...(loop.comments || []), res.data]
                    };
                }
                return loop;
            }));
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await axios.delete(`${serverUrl}/api/loop/${showComments}/comment/${commentId}`, { withCredentials: true });
            setComments(comments.filter(c => c._id !== commentId));

            setLoops(loops.map(loop => {
                if (loop._id === showComments) {
                    return {
                        ...loop,
                        comments: loop.comments.filter(c => c._id !== commentId)
                    };
                }
                return loop;
            }));
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const openShareModal = async (loopId) => {
        setShowShareModal(loopId);
        setLoadingFollowers(true);
        setSelectedFollowers([]);
        try {
            const res = await axios.get(`${serverUrl}/api/user/me`, { withCredentials: true });
            setFollowers(res.data.following || []);
        } catch (error) {
            console.error("Error fetching followers:", error);
        } finally {
            setLoadingFollowers(false);
        }
    };

    const closeShareModal = () => {
        setShowShareModal(null);
        setSelectedFollowers([]);
    };

    const toggleFollowerSelection = (followerId) => {
        if (selectedFollowers.includes(followerId)) {
            setSelectedFollowers(selectedFollowers.filter(id => id !== followerId));
        } else {
            setSelectedFollowers([...selectedFollowers, followerId]);
        }
    };

    const handleShareToFollowers = async () => {
        if (selectedFollowers.length === 0 || !showShareModal) return;

        setSendingShare(true);
        const loop = loops.find(l => l._id === showShareModal);

        try {
            await Promise.all(selectedFollowers.map(async (followerId) => {
                const message = `Check out this reel!\n\n🎬 ${loop.author?.username}: ${loop.caption || ''}\n\n🔗 ${window.location.origin}/reels?id=${loop._id}`;
                await axios.post(`${serverUrl}/api/chat/send/${followerId}`, { message }, { withCredentials: true });
            }));

            alert(`Reel shared with ${selectedFollowers.length} ${selectedFollowers.length === 1 ? 'person' : 'people'}!`);
            closeShareModal();
        } catch (error) {
            console.error("Error sharing reel:", error);
            alert("Failed to share. Please try again.");
        } finally {
            setSendingShare(false);
        }
    };

    const handleCopyLink = async () => {
        const shareUrl = `${window.location.origin}/reels?id=${showShareModal}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert("Link copied to clipboard!");
        } catch (error) {
            console.error("Error copying link:", error);
        }
    };

    const toggleMute = () => {
        setMuted(!muted);
    };

    const togglePause = (loopId) => {
        const video = videoRefs.current[loopId];
        if (video) {
            if (video.paused) {
                video.play();
                setPaused(prev => ({ ...prev, [loopId]: false }));
            } else {
                video.pause();
                setPaused(prev => ({ ...prev, [loopId]: true }));
            }
        }
    };

    return (
        <div className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {loops.length === 0 ? (
                <div className="h-screen flex flex-col items-center justify-center text-white">
                    <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold">No Reels Yet</p>
                    <p className="text-gray-400 mt-2">Be the first to upload a reel!</p>
                </div>
            ) : (
                loops.map((loop) => {
                    const isOwner = String(user?._id) === String(loop.author?._id);
                    const isLiked = loop.likes?.includes(user?._id);
                    const isFollowing = loop.author?.followers?.includes(user?._id);

                    return (
                        <div key={loop._id} className="h-screen w-full snap-start relative bg-black flex items-center justify-center">
                            {/* Video Container */}
                            <div className="relative h-full w-full max-w-[450px]">
                                <video
                                    ref={el => videoRefs.current[loop._id] = el}
                                    src={loop.media}
                                    className="h-full w-full object-cover"
                                    loop
                                    autoPlay
                                    muted={muted}
                                    playsInline
                                />

                                {/* Play/Pause - Tap anywhere */}
                                <button
                                    onClick={() => togglePause(loop._id)}
                                    className="absolute inset-0 flex items-center justify-center z-10"
                                >
                                    {paused[loop._id] && (
                                        <div className="p-5 rounded-full backdrop-blur-sm">
                                            <FaPlay className="text-white w-12 h-12 ml-1 drop-shadow-lg" />
                                        </div>
                                    )}
                                </button>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

                                {/* Mute Button - Top Right */}
                                <button
                                    onClick={toggleMute}
                                    className="absolute top-4 right-4 z-20 p-2.5 rounded-full hover:bg-black/10 transition-colors"
                                >
                                    {muted ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6 drop-shadow-md">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6 drop-shadow-md">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                                        </svg>
                                    )}
                                </button>

                                {/* Author Info - Bottom Left */}
                                <div className="absolute bottom-24 left-4 text-white z-10 max-w-[70%]">
                                    <div className="flex items-center gap-3 mb-3 px-1 py-1.5 rounded-full w-fit">
                                        {loop.author?.profileImg ? (
                                            <img src={loop.author.profileImg} alt="user" className="w-9 h-9 rounded-full border border-white/50" />
                                        ) : (
                                            <DefaultAvatar name={loop.author?.name} username={loop.author?.username} size="sm" className="border border-white/50" />
                                        )}
                                        <span className="font-bold text-sm tracking-wide drop-shadow-md">{loop.author?.username}</span>
                                        {user && !isOwner && (
                                            <button
                                                onClick={() => handleFollow(loop.author._id)}
                                                className={`text-xs font-bold px-3 py-1 rounded-full transition-colors border ${isFollowing ? 'bg-transparent border-white text-white' : 'bg-transparent border-white text-white hover:bg-white/10'}`}
                                            >
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm font-light leading-relaxed drop-shadow-md pl-1">{loop.caption}</p>
                                </div>

                                {/* Action Buttons - Bottom Right */}
                                <div className="absolute bottom-24 right-4 flex flex-col gap-6 text-white z-10 items-center">
                                    <div
                                        className="flex flex-col items-center gap-1 group cursor-pointer"
                                        onClick={() => handleLike(loop._id)}
                                    >
                                        <div className={`p-2 transition-all duration-300 group-hover:scale-110 ${isLiked ? 'text-red-500' : ''}`}>
                                            <FaHeart size={28} className={`drop-shadow-lg ${isLiked ? 'text-red-500' : 'text-white'}`} />
                                        </div>
                                        <span className="text-xs font-medium drop-shadow-md">{loop.likes?.length || 0}</span>
                                    </div>
                                    <div
                                        className="flex flex-col items-center gap-1 group cursor-pointer"
                                        onClick={() => openComments(loop._id)}
                                    >
                                        <div className="p-2 transition-all duration-300 group-hover:scale-110">
                                            <FaComment size={28} className="text-white drop-shadow-lg" />
                                        </div>
                                        <span className="text-xs font-medium drop-shadow-md">{loop.comments?.length || 0}</span>
                                    </div>
                                    <div
                                        className="flex flex-col items-center gap-1 group cursor-pointer"
                                        onClick={() => openShareModal(loop._id)}
                                    >
                                        <div className="p-2 transition-all duration-300 group-hover:scale-110">
                                            <FaShare size={28} className="text-white drop-shadow-lg" />
                                        </div>
                                        <span className="text-xs font-medium drop-shadow-md">Share</span>
                                    </div>
                                    {isOwner && (
                                        <div
                                            className="flex flex-col items-center gap-1 group cursor-pointer"
                                            onClick={() => handleDelete(loop._id)}
                                        >
                                            <div className="p-2 transition-all duration-300 group-hover:scale-110">
                                                <FaTrash size={24} className="text-white drop-shadow-lg hover:text-red-400" />
                                            </div>
                                            <span className="text-xs font-medium text-white drop-shadow-md group-hover:text-red-400">Delete</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Comments Modal */}
            {showComments && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full md:w-[500px] max-h-[70vh] bg-[#18181b] md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden border border-white/10">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-white font-bold text-lg">Comments</h3>
                            <button onClick={closeComments} className="text-white/70 hover:text-white p-2">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingComments ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">No comments yet. Be the first!</div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment._id} className="flex gap-3 group">
                                        {comment.author?.profileImg ? (
                                            <img src={comment.author.profileImg} alt="user" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                        ) : (
                                            <DefaultAvatar name={comment.author?.name} username={comment.author?.username} size="md" />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-semibold text-sm">{comment.author?.username}</span>
                                                <span className="text-gray-500 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-white/80 text-sm mt-1">{comment.content}</p>
                                        </div>
                                        {String(user?._id) === String(comment.author?._id) && (
                                            <button onClick={() => handleDeleteComment(comment._id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 p-2 transition-opacity">
                                                <FaTrash size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleAddComment} className="p-4 border-t border-white/10 flex gap-3">
                            {user?.profileImg ? (
                                <img src={user.profileImg} alt="you" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                            ) : (
                                <DefaultAvatar name={user?.name} username={user?.username} size="md" />
                            )}
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-gray-500 outline-none focus:border-white/30"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className={`px-4 py-2 rounded-full font-semibold transition-colors ${newComment.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
                            >
                                Post
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full md:w-[500px] max-h-[80vh] bg-[#18181b] md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden border border-white/10">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-white font-bold text-lg">Share Reel</h3>
                            <button onClick={closeShareModal} className="text-white/70 hover:text-white p-2">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="p-4 border-b border-white/10">
                            <button onClick={handleCopyLink} className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                                Copy Link
                            </button>
                        </div>

                        <div className="p-4 border-b border-white/10">
                            <p className="text-white/70 text-sm">Send to</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loadingFollowers ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                </div>
                            ) : followers.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p>You're not following anyone yet.</p>
                                </div>
                            ) : (
                                followers.map((follower) => {
                                    const isSelected = selectedFollowers.includes(follower._id);
                                    return (
                                        <div
                                            key={follower._id}
                                            onClick={() => toggleFollowerSelection(follower._id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                                        >
                                            {follower.profileImg ? (
                                                <img src={follower.profileImg} alt="user" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                            ) : (
                                                <DefaultAvatar name={follower.name} username={follower.username} size="lg" />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-white font-semibold">{follower.username}</p>
                                                <p className="text-gray-400 text-sm">{follower.name}</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/30'}`}>
                                                {isSelected && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {followers.length > 0 && (
                            <div className="p-4 border-t border-white/10">
                                <button
                                    onClick={handleShareToFollowers}
                                    disabled={selectedFollowers.length === 0 || sendingShare}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${selectedFollowers.length > 0 && !sendingShare ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
                                >
                                    {sendingShare ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <FaPaperPlane size={16} />
                                            Send {selectedFollowers.length > 0 && `(${selectedFollowers.length})`}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reels;
