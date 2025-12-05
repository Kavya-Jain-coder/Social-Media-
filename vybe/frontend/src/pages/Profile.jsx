import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { FaCog, FaTh, FaUserTag, FaSignOutAlt, FaHeart, FaTimes, FaCamera } from "react-icons/fa";
import { RiMovieLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DefaultAvatar from "../components/DefaultAvatar";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("posts");
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", username: "", bio: "" });
    const [updating, setUpdating] = useState(false);
    const { logout, setUser: setAuthUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        axios
            .get(`${serverUrl}/api/user/me`, { withCredentials: true })
            .then((res) => {
                setUser(res.data);
                setEditForm({
                    name: res.data.name || "",
                    username: res.data.username || "",
                    bio: res.data.bio || ""
                });
            })
            .catch(() => { });
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/signin');
    }

    const handleProfileImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profileImg", file);

        try {
            const res = await axios.put(`${serverUrl}/api/user/update-profile`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            });
            setUser(res.data);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const handleEditProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await axios.put(`${serverUrl}/api/user/update-details`, editForm, {
                withCredentials: true
            });
            setUser(res.data);
            if (setAuthUser) setAuthUser(res.data);
            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert(error.response?.data?.message || "Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    const UserListModal = ({ title, users, onClose }) => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {users?.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No users found</div>
                    ) : (
                        users?.map(u => (
                            <div key={u._id} className="flex items-center justify-between group cursor-pointer" onClick={() => {
                                navigate(`/user/${u._id}`);
                                onClose();
                            }}>
                                <div className="flex items-center gap-3">
                                    {u.profileImg ? (
                                        <img src={u.profileImg} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                    ) : (
                                        <DefaultAvatar name={u.name} username={u.username} size="md" />
                                    )}
                                    <div>
                                        <p className="font-bold text-sm">{u.username}</p>
                                        <p className="text-xs text-gray-400">{u.name}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    if (!user)
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
            </div>
        );

    return (
        <div className="w-full text-white">

            {/* Followers Modal */}
            {showFollowersModal && (
                <UserListModal
                    title="Followers"
                    users={user.followers}
                    onClose={() => setShowFollowersModal(false)}
                />
            )}

            {/* Following Modal */}
            {showFollowingModal && (
                <UserListModal
                    title="Following"
                    users={user.following}
                    onClose={() => setShowFollowingModal(false)}
                />
            )}

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-xl font-bold">Edit Profile</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Profile Picture Section */}
                        <div className="p-6 flex flex-col items-center border-b border-white/10">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
                                    {user.profileImg ? (
                                        <img src={user.profileImg} className="w-full h-full object-cover" />
                                    ) : (
                                        <DefaultAvatar name={user.name} username={user.username} size="3xl" />
                                    )}
                                </div>
                                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <FaCamera className="text-white" size={24} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleProfileImageChange}
                                    />
                                </label>
                            </div>
                            <p className="text-sm text-gray-400 mt-2">Tap to change photo</p>
                        </div>

                        {/* Edit Form */}
                        <form onSubmit={handleEditProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Your username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Write something about yourself..."
                                    rows={3}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                            >
                                {updating ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PROFILE HEADER */}
            <div className="px-4 pt-6 pb-6">
                <div className="luxury-card p-6 mb-6">
                    <div className="flex items-center gap-8 mb-6">

                        <div className="w-24 h-24 rounded-full border-2 border-white/20 p-[2px] shadow-lg shadow-white/5 relative group">
                            {user.profileImg ? (
                                <img
                                    src={user.profileImg}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <DefaultAvatar name={user.name} username={user.username} size="3xl" />
                            )}
                            <label htmlFor="profile-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <FaCog className="text-white" />
                            </label>
                            <input
                                type="file"
                                id="profile-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleProfileImageChange}
                            />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <h1 className="text-2xl font-bold tracking-tight">{user.username}</h1>
                            </div>

                            <div className="flex gap-8 text-center">
                                <div>
                                    <p className="font-bold text-lg">{user.posts?.length || 0}</p>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">posts</p>
                                </div>
                                <div
                                    onClick={() => setShowFollowersModal(true)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    <p className="font-bold text-lg">{user.followers?.length || 0}</p>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">followers</p>
                                </div>
                                <div
                                    onClick={() => setShowFollowingModal(true)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    <p className="font-bold text-lg">{user.following?.length || 0}</p>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">following</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="font-semibold text-lg mb-1">{user.name}</p>
                    <p className="text-gray-300 text-sm mb-6 font-light">{user.bio || "Digital Creator • Visual Storyteller"}</p>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex-1 py-3 px-6 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white font-semibold text-sm transition-all duration-200 border border-white/10 hover:border-white/20"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 py-3 px-6 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm transition-all duration-200 border border-red-500/20 hover:border-red-500/40"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="border-t border-white/10 glass-heavy sticky top-0 z-40 backdrop-blur-xl">
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
                    <button
                        onClick={() => setActiveTab("stories")}
                        className={`w-full py-4 border-b-2 flex justify-center transition-all duration-300 ${activeTab === "stories" ? "border-white text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                </div>
            </div>

            {/* GRID */}
            <div className="mt-4 grid grid-cols-3 gap-[2px]">
                {activeTab === "posts" && user.posts?.map((post) => (
                    <div key={post._id} className="aspect-square bg-[#18181b] relative group cursor-pointer overflow-hidden">
                        <img src={post.media} alt="post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2">
                                <FaHeart className="text-white" />
                                <span className="text-white font-bold">{post.likes?.length || 0}</span>
                            </div>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Delete this post?")) {
                                        try {
                                            await axios.delete(`${serverUrl}/api/post/${post._id}`, { withCredentials: true });
                                            setUser(prev => ({
                                                ...prev,
                                                posts: prev.posts.filter(p => p._id !== post._id)
                                            }));
                                        } catch (err) {
                                            console.error("Error deleting post:", err);
                                        }
                                    }
                                }}
                                className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
                {activeTab === "reels" && user.loops?.map((loop) => (
                    <div key={loop._id} className="aspect-[9/16] bg-[#18181b] relative group cursor-pointer overflow-hidden">
                        <video src={loop.media} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                            <RiMovieLine className="text-white" size={24} />
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Delete this reel?")) {
                                        try {
                                            await axios.delete(`${serverUrl}/api/loop/${loop._id}`, { withCredentials: true });
                                            setUser(prev => ({
                                                ...prev,
                                                loops: prev.loops.filter(l => l._id !== loop._id)
                                            }));
                                        } catch (err) {
                                            console.error("Error deleting reel:", err);
                                        }
                                    }
                                }}
                                className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
                {activeTab === "stories" && user.stories?.map((story) => (
                    <div key={story._id} className="aspect-[9/16] bg-[#18181b] relative group cursor-pointer overflow-hidden">
                        {story.mediaType === 'video' ? (
                            <video src={story.media} className="w-full h-full object-cover" />
                        ) : (
                            <img src={story.media} alt="story" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                            <span className="text-xs text-white font-medium">{new Date(story.createdAt).toLocaleDateString()}</span>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Delete this story?")) {
                                        try {
                                            await axios.delete(`${serverUrl}/api/story/${story._id}`, { withCredentials: true });
                                            setUser(prev => ({
                                                ...prev,
                                                stories: prev.stories.filter(s => s._id !== story._id)
                                            }));
                                        } catch (err) {
                                            console.error("Error deleting story:", err);
                                        }
                                    }
                                }}
                                className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}

                {activeTab === "posts" && (!user.posts || user.posts.length === 0) && (
                    <div className="col-span-3 py-10 text-center text-gray-500">No posts yet</div>
                )}
                {activeTab === "reels" && (!user.loops || user.loops.length === 0) && (
                    <div className="col-span-3 py-10 text-center text-gray-500">No reels yet</div>
                )}
                {activeTab === "stories" && (!user.stories || user.stories.length === 0) && (
                    <div className="col-span-3 py-10 text-center text-gray-500">No active stories</div>
                )}
            </div>

        </div>
    );
};

export default Profile;