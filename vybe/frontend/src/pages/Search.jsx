import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DefaultAvatar from "../components/DefaultAvatar";

const Search = () => {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (!query.trim()) {
                setUsers([]);
                return;
            }

            setLoading(true);
            try {
                const res = await axios.get(`${serverUrl}/api/user/search?query=${query}`, {
                    withCredentials: true,
                });
                setUsers(res.data);
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            searchUsers();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const handleFollow = async (userId, e) => {
        e.stopPropagation();
        try {
            await axios.put(`${serverUrl}/api/user/follow/${userId}`, {}, { withCredentials: true });
            setUsers(users.map(u => {
                if (u._id === userId) {
                    const isFollowing = u.followers.includes(currentUser._id);
                    return {
                        ...u,
                        followers: isFollowing ? u.followers.filter(id => id !== currentUser._id) : [...u.followers, currentUser._id]
                    };
                }
                return u;
            }));
        } catch (error) {
            console.error("Error following user:", error);
        }
    };

    const handleMessage = (user, e) => {
        e.stopPropagation();
        navigate("/chat", { state: { selectedUser: user } });
    };

    const handleViewProfile = (userId) => {
        navigate(`/user/${userId}`);
    };

    return (
        <div className="w-full text-white">
            {/* Search Header */}
            <div className="mb-8 sticky top-0 z-50 pt-4 pb-2 glass-heavy mx-[-16px] px-4 backdrop-blur-xl">
                <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Search</h1>
                <div className="relative group">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for people..."
                        className="luxury-input pr-14 bg-white/5 border-white/10 focus:bg-black/50"
                        autoFocus
                    />
                    <FaSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors" />
                </div>
            </div>

            {/* Results */}
            <div className="space-y-3 pb-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                ) : users.length > 0 ? (
                    users.map((user) => (
                        <div
                            key={user._id}
                            onClick={() => handleViewProfile(user._id)}
                            className="luxury-card flex items-center justify-between p-4 hover:bg-white/5 transition-all duration-300 cursor-pointer group border-transparent hover:border-white/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border-2 border-white/10 p-[2px] group-hover:border-white/30 transition-colors flex items-center justify-center">
                                    {user.profileImg ? (
                                        <img
                                            src={user.profileImg}
                                            alt={user.username}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <DefaultAvatar name={user.name} username={user.username} size="xl" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-base tracking-wide">{user.username}</p>
                                    <p className="text-sm text-gray-400 font-light">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.followers?.length || 0} followers</p>
                                </div>
                            </div>
                            {currentUser && user._id !== currentUser._id && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={(e) => handleMessage(user, e)}
                                        className="px-5 py-2.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white font-semibold text-sm transition-all duration-200 border border-white/10 hover:border-white/20"
                                    >
                                        Message
                                    </button>
                                    <button
                                        onClick={(e) => handleFollow(user._id, e)}
                                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${user.followers.includes(currentUser._id)
                                            ? 'bg-transparent border border-white/30 text-white hover:border-white/50 hover:bg-white/5'
                                            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-purple-500/20'}`}
                                    >
                                        {user.followers.includes(currentUser._id) ? 'Following' : 'Follow'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : query && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg font-light">No users found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
