import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { FaTh, FaArrowLeft, FaHeart } from "react-icons/fa";
import { RiMovieLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import DefaultAvatar from "../components/DefaultAvatar";

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("posts");
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { userId } = useParams();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${serverUrl}/api/user/${userId}`, { withCredentials: true });
                setUser(res.data);
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const handleFollow = async () => {
        try {
            await axios.put(`${serverUrl}/api/user/follow/${userId}`, {}, { withCredentials: true });
            setUser(prev => {
                const isFollowing = prev.followers.some(f =>
                    (typeof f === 'string' ? f : f._id) === currentUser._id
                );
                return {
                    ...prev,
                    followers: isFollowing
                        ? prev.followers.filter(f => (typeof f === 'string' ? f : f._id) !== currentUser._id)
                        : [...prev.followers, currentUser._id]
                };
            });
        } catch (error) {
            console.error("Error following user:", error);
        }
    };

    const handleMessage = () => {
        navigate("/chat", { state: { selectedUser: user } });
    };

    const handleShareProfile = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link);
        alert("Profile link copied to clipboard!");
    };

    const isFollowing = user?.followers?.some(f =>
        (typeof f === 'string' ? f : f._id) === currentUser?._id
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-white">
                <p className="text-xl text-gray-400">User not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="w-full text-white pb-20">
            {/* Header with back button */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <FaArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="font-bold text-lg">{user.username}</h1>
                    <p className="text-xs text-gray-400">{user.posts?.length || 0} posts</p>
                </div>
            </div>

            {/* Profile Header */}
            <div className="px-4 pt-6 pb-6">
                <div className="luxury-card p-6 mb-6">
                    <div className="flex items-center gap-8 mb-6">
                        <div className="w-24 h-24 rounded-full border-2 border-white/20 p-[2px] shadow-lg shadow-white/5">
                            {user.profileImg ? (
                                <img
                                    src={user.profileImg}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <DefaultAvatar name={user.name} username={user.username} size="3xl" />
                            )}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-2xl font-bold tracking-tight mb-3">{user.username}</h1>

                            <div className="flex gap-8 text-center">
                                <div>
                                    <p className="font-bold text-lg">{user.posts?.length || 0}</p>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">posts</p>
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{user.followers?.length || 0}</p>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">followers</p>
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{user.following?.length || 0}</p>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">following</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="font-semibold text-lg mb-1">{user.name}</p>
                    <p className="text-gray-300 text-sm mb-6 font-light">Member since {new Date(user.createdAt).toLocaleDateString()}</p>

                    {currentUser && user._id !== currentUser._id && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleFollow}
                                className={`flex-1 py-2.5 rounded-2xl font-semibold transition-colors text-sm ${isFollowing
                                    ? 'btn-luxury-outline'
                                    : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button
                                onClick={handleMessage}
                                className="flex-1 btn-luxury-outline py-2.5 text-sm"
                            >
                                Message
                            </button>
                            <button
                                onClick={handleShareProfile}
                                className="flex-1 btn-luxury-outline py-2.5 text-sm"
                            >
                                Share
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-white/10 glass-heavy sticky top-[60px] z-40 backdrop-blur-xl">
                <div className="flex justify-around">
                    <button
                        onClick={() => setActiveTab("posts")}
                        className={`w-full py-4 border-b-2 flex justify-center transition-all duration-300 ${activeTab === "posts" ? "border-white text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        <FaTh size={20} />
                    </button>
                    <button
                        onClick={() => setActiveTab("reels")}
                        className={`w-full py-4 border-b-2 flex justify-center transition-all duration-300 ${activeTab === "reels" ? "border-white text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        <RiMovieLine size={22} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="mt-4 grid grid-cols-3 gap-[2px]">
                {activeTab === "posts" && user.posts?.map((post) => (
                    <div key={post._id} className="aspect-square bg-[#18181b] relative group cursor-pointer overflow-hidden">
                        <img src={post.media} alt="post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <FaHeart className="text-white" /> <span className="text-white ml-2 font-bold">{post.likes?.length || 0}</span>
                        </div>
                    </div>
                ))}
                {activeTab === "reels" && user.loops?.map((loop) => (
                    <div key={loop._id} className="aspect-[9/16] bg-[#18181b] relative group cursor-pointer overflow-hidden">
                        <video src={loop.media} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <RiMovieLine className="text-white" />
                        </div>
                    </div>
                ))}
                {activeTab === "posts" && (!user.posts || user.posts.length === 0) && (
                    <div className="col-span-3 py-10 text-center text-gray-500">No posts yet</div>
                )}
                {activeTab === "reels" && (!user.loops || user.loops.length === 0) && (
                    <div className="col-span-3 py-10 text-center text-gray-500">No reels yet</div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
