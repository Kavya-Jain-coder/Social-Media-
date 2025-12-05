import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { serverUrl } from '../App';
import { useAuth } from '../context/AuthContext';
import DefaultAvatar from '../components/DefaultAvatar';

const Chat = () => {
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [sending, setSending] = useState(false);
    const [viewingMedia, setViewingMedia] = useState(null);
    const fileInputRef = useRef(null);
    const { user: currentUser } = useAuth();
    const scrollRef = useRef();
    const navigate = useNavigate();

    const location = useLocation();
    const [isNavigatedFromSearch, setIsNavigatedFromSearch] = useState(false);

    useEffect(() => {
        if (currentUser) {
            const newSocket = io(serverUrl, {
                query: { userId: currentUser._id }
            });
            setSocket(newSocket);
            return () => newSocket.close();
        }
    }, [currentUser]);

    useEffect(() => {
        if (location.state?.selectedUser && currentUser) {
            const selectedUser = location.state.selectedUser;
            setIsNavigatedFromSearch(true);
            setCurrentChat({ participants: [selectedUser], isTemp: true });
            setMessages([]);
        } else if (location.pathname === '/chat' && !location.state?.selectedUser) {
            setCurrentChat(null);
        }
    }, [location.state?.selectedUser?._id, location.pathname, currentUser?._id]);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!currentUser) return;
            try {
                const res = await axios.get(`${serverUrl}/api/chat/conversations`, { withCredentials: true });
                setConversations(res.data);

                if (isNavigatedFromSearch && location.state?.selectedUser) {
                    const selectedUser = location.state.selectedUser;
                    const existingConv = res.data.find(c =>
                        c.participants.some(p => p._id === selectedUser._id)
                    );

                    if (existingConv) {
                        const otherUser = existingConv.participants.find(p => p._id !== currentUser?._id) || existingConv.participants[0];
                        setCurrentChat({ ...existingConv, participants: [otherUser] });
                    }
                    setIsNavigatedFromSearch(false);
                }
            } catch (error) {
                console.error("Error fetching conversations:", error);
            }
        };

        fetchConversations();
    }, [currentUser?._id]);

    useEffect(() => {
        if (currentChat && !currentChat.isTemp) {
            const fetchMessages = async () => {
                try {
                    const res = await axios.get(`${serverUrl}/api/chat/${currentChat.participants[0]._id}`, { withCredentials: true });
                    setMessages(res.data);
                } catch (error) {
                    setMessages([]);
                }
            };
            fetchMessages();
        } else if (currentChat && currentChat.isTemp) {
            setMessages([]);
        }
    }, [currentChat]);

    useEffect(() => {
        if (socket) {
            socket.on("newMessage", (message) => {
                if (currentChat && (message.senderId === currentChat.participants[0]._id || message.senderId === currentUser._id)) {
                    setMessages((prev) => [...prev, message]);
                }
            });
            socket.on("messageDeleted", (messageId) => {
                setMessages((prev) => prev.filter(m => m._id !== messageId));
            });
            socket.on("messageUpdated", (updatedMessage) => {
                setMessages((prev) => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
            });
        }
        return () => {
            socket?.off("newMessage");
            socket?.off("messageDeleted");
            socket?.off("messageUpdated");
        };
    }, [socket, currentChat, currentUser]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedMedia(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview({
                    url: reader.result,
                    type: file.type.startsWith('video') ? 'video' : 'image'
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const clearMediaPreview = () => {
        setSelectedMedia(null);
        setMediaPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedMedia) || !currentChat || sending) return;

        setSending(true);
        try {
            const receiverId = currentChat.participants[0]._id;

            const formData = new FormData();
            if (newMessage.trim()) {
                formData.append("message", newMessage);
            }
            if (selectedMedia) {
                formData.append("media", selectedMedia);
            }

            const res = await axios.post(`${serverUrl}/api/chat/send/${receiverId}`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessages([...messages, res.data]);
            setNewMessage("");
            clearMediaPreview();

            if (currentChat.isTemp) {
                const convRes = await axios.get(`${serverUrl}/api/chat/conversations`, { withCredentials: true });
                setConversations(convRes.data);

                const newConv = convRes.data.find(c =>
                    c.participants.some(p => p._id === receiverId)
                );
                if (newConv) {
                    const otherUser = newConv.participants.find(p => p._id !== currentUser?._id) || newConv.participants[0];
                    setCurrentChat({ ...newConv, participants: [otherUser] });
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`${serverUrl}/api/chat/message/${messageId}`, { withCredentials: true });
            setMessages(prev => prev.filter(m => m._id !== messageId));
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message: " + (error.response?.data?.error || error.message));
        }
    };

    const handleEditMessage = async (messageId) => {
        if (!editContent.trim()) return;
        try {
            const res = await axios.put(`${serverUrl}/api/chat/message/${messageId}`, {
                message: editContent
            }, { withCredentials: true });
            setMessages(prev => prev.map(m => m._id === messageId ? res.data : m));
            setEditingMessage(null);
            setEditContent("");
        } catch (error) {
            console.error("Error editing message:", error);
        }
    };

    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        if (msg.senderId === currentUser?._id) {
            setContextMenu({
                visible: true,
                x: e.clientX || e.touches?.[0]?.clientX || window.innerWidth / 2,
                y: e.clientY || e.touches?.[0]?.clientY || window.innerHeight / 2,
                messageId: msg._id,
                message: msg.message
            });
        }
    };

    // Long press handler for mobile
    const longPressTimer = useRef(null);

    const handleTouchStart = (e, msg) => {
        if (msg.senderId !== currentUser?._id) return;
        longPressTimer.current = setTimeout(() => {
            // Center the menu on mobile for better UX
            setContextMenu({
                visible: true,
                x: window.innerWidth / 2 - 60, // Center horizontally (menu is ~120px wide)
                y: window.innerHeight / 2 - 50, // Center vertically
                messageId: msg._id,
                message: msg.message
            });
        }, 500); // 500ms long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const renderMessageContent = (msg) => {
        const isMe = msg.senderId === currentUser?._id;

        return (
            <div className="flex flex-col gap-1">
                {/* Media content */}
                {msg.media && (
                    <div
                        className="cursor-pointer rounded-lg overflow-hidden max-w-[250px]"
                        onClick={() => setViewingMedia(msg)}
                    >
                        {msg.mediaType === 'video' ? (
                            <video
                                src={msg.media}
                                className="w-full h-auto rounded-lg"
                                muted
                            />
                        ) : (
                            <img
                                src={msg.media}
                                alt="shared media"
                                className="w-full h-auto rounded-lg"
                            />
                        )}
                    </div>
                )}
                {/* Text content */}
                {msg.message && (
                    <p className="text-[15px] leading-relaxed">{msg.message}</p>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-[100dvh] bg-black text-white relative">

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="fixed bg-[#27272a] border border-white/10 rounded-xl shadow-2xl z-[200] overflow-hidden min-w-[140px]"
                    style={{
                        top: Math.min(contextMenu.y, window.innerHeight - 120),
                        left: Math.min(Math.max(contextMenu.x, 10), window.innerWidth - 150)
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            setEditingMessage(contextMenu.messageId);
                            setEditContent(contextMenu.message);
                            setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 transition-colors text-left"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            handleDeleteMessage(contextMenu.messageId);
                            setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/20 text-red-400 transition-colors text-left"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                    </button>
                </div>
            )}

            {/* Media Viewer Modal */}
            {viewingMedia && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
                    onClick={() => setViewingMedia(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                        onClick={() => setViewingMedia(null)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {viewingMedia.mediaType === 'video' ? (
                        <video
                            src={viewingMedia.media}
                            className="max-w-full max-h-[90vh] rounded-lg"
                            controls
                            autoPlay
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <img
                            src={viewingMedia.media}
                            alt="media"
                            className="max-w-full max-h-[90vh] rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}

            {/* Chat List - Hidden on mobile when chat is open */}
            <div className={`w-full md:w-1/3 border-r border-white/10 ${currentChat ? 'hidden md:block' : 'block'}`}>
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-2xl font-bold">Messages</h2>
                </div>
                <div className="overflow-y-auto h-full pb-20 md:pb-0">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#a1a1aa]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <p className="text-[#a1a1aa] text-center">No messages yet</p>
                            <p className="text-[#71717a] text-sm text-center mt-2">Start a conversation from Search</p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const otherUser = conv.participants.find(p => p._id !== currentUser?._id) || conv.participants[0];
                            return (
                                <div
                                    key={conv._id}
                                    onClick={() => setCurrentChat({ ...conv, participants: [otherUser] })}
                                    className={`flex items-center gap-3 p-4 hover:bg-[#18181b] cursor-pointer transition-colors ${currentChat?.participants[0]?._id === otherUser._id ? 'bg-[#18181b]' : ''}`}
                                >
                                    {otherUser.profileImg ? (
                                        <img src={otherUser.profileImg} alt="user" className="w-14 h-14 rounded-full object-cover border border-white/10" />
                                    ) : (
                                        <DefaultAvatar name={otherUser.name} username={otherUser.username} size="xl" className="border border-white/10" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate">{otherUser.username}</div>
                                        <div className="text-sm text-[#a1a1aa] truncate">{otherUser.name}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Window - Full screen on mobile when chat is open */}
            <div className={`w-full md:w-2/3 flex flex-col h-[100dvh] bg-[#09090b] relative ${currentChat ? 'flex fixed inset-0 z-50 md:static' : 'hidden md:flex'}`}>
                {currentChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex-none h-20 px-4 md:px-6 border-b border-white/10 flex items-center gap-4 bg-[#09090b]/80 backdrop-blur-xl z-20">
                            <button
                                className="md:hidden text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                                onClick={() => setCurrentChat(null)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                            </button>

                            <div
                                className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate(`/user/${currentChat.participants[0]._id}`)}
                            >
                                <div className="relative">
                                    {currentChat.participants[0].profileImg ? (
                                        <img
                                            src={currentChat.participants[0].profileImg}
                                            alt="user"
                                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#27272a] object-cover"
                                        />
                                    ) : (
                                        <DefaultAvatar
                                            name={currentChat.participants[0].name}
                                            username={currentChat.participants[0].username}
                                            size="lg"
                                            className="border-2 border-[#27272a]"
                                        />
                                    )}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 rounded-full border-2 border-[#09090b]"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-base md:text-lg truncate leading-tight">
                                        {currentChat.participants[0].username}
                                    </h3>
                                    <p className="text-xs md:text-sm text-[#a1a1aa] truncate font-medium">
                                        {currentChat.participants[0].name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 bg-[#09090b] scrollbar-hide">
                            {messages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-24 h-24 rounded-full bg-[#18181b] flex items-center justify-center mb-6 ring-1 ring-white/10">
                                        {currentChat.participants[0].profileImg ? (
                                            <img
                                                src={currentChat.participants[0].profileImg}
                                                className="w-20 h-20 rounded-full opacity-50 grayscale"
                                            />
                                        ) : (
                                            <DefaultAvatar
                                                name={currentChat.participants[0].name}
                                                username={currentChat.participants[0].username}
                                                size="2xl"
                                                className="opacity-50"
                                            />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No messages yet</h3>
                                    <p className="text-[#a1a1aa] max-w-xs">
                                        Send a message to start the conversation with <span className="text-white font-semibold">{currentChat.participants[0].username}</span>.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.senderId === currentUser?._id;
                                    const isLast = idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId;

                                    return (
                                        <div
                                            key={msg._id || idx}
                                            ref={scrollRef}
                                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isLast ? 'mb-2' : ''} group`}
                                        >
                                            {editingMessage === msg._id ? (
                                                <div className="flex items-center gap-2 max-w-[85%] md:max-w-[60%]">
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="flex-1 bg-[#27272a] text-white px-4 py-2 rounded-xl outline-none border border-white/10 focus:border-blue-500"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleEditMessage(msg._id)}
                                                        className="p-2 bg-blue-600 rounded-full hover:bg-blue-500"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingMessage(null);
                                                            setEditContent("");
                                                        }}
                                                        className="p-2 bg-[#27272a] rounded-full hover:bg-[#3f3f46]"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onContextMenu={(e) => handleContextMenu(e, msg)}
                                                    onTouchStart={(e) => handleTouchStart(e, msg)}
                                                    onTouchEnd={handleTouchEnd}
                                                    onTouchMove={handleTouchEnd}
                                                    className={`max-w-[85%] md:max-w-[60%] px-5 py-4 break-words shadow-sm cursor-pointer select-none ${isMe
                                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                                                        : 'bg-[#27272a] text-[#f4f4f5] rounded-2xl rounded-tl-sm border border-white/5'
                                                        } ${msg.media ? 'p-3' : ''}`}
                                                >
                                                    {renderMessageContent(msg)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div className="h-4" />
                        </div>

                        {/* Media Preview */}
                        {mediaPreview && (
                            <div className="px-4 py-2 bg-[#18181b] border-t border-white/10">
                                <div className="relative inline-block">
                                    {mediaPreview.type === 'video' ? (
                                        <video
                                            src={mediaPreview.url}
                                            className="h-20 rounded-lg"
                                        />
                                    ) : (
                                        <img
                                            src={mediaPreview.url}
                                            alt="preview"
                                            className="h-20 rounded-lg"
                                        />
                                    )}
                                    <button
                                        onClick={clearMediaPreview}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Input Area - Fixed on mobile to stay above bottom nav */}
                        <div className="fixed md:relative bottom-[70px] md:bottom-auto left-0 right-0 md:left-auto md:right-auto p-4 md:p-6 bg-[#09090b] border-t border-white/10 z-[60] md:z-20">
                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-center gap-3 max-w-4xl mx-auto bg-[#18181b]/50 p-2.5 rounded-full border border-white/10 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all"
                            >
                                {/* Media Upload Button */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleMediaSelect}
                                    accept="image/*,video/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-[#a1a1aa] hover:text-white transition-colors rounded-full hover:bg-white/10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </button>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Message..."
                                    className="flex-1 bg-transparent text-white placeholder-[#71717a] outline-none px-2 py-3 text-base"
                                />

                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !selectedMedia) || sending}
                                    className={`p-3 rounded-full transition-all duration-200 ${(newMessage.trim() || selectedMedia) && !sending
                                        ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                                        : 'bg-[#27272a] text-[#71717a] cursor-not-allowed'
                                        }`}
                                >
                                    {sending ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#09090b]">
                        <div className="w-32 h-32 rounded-full bg-[#18181b] flex items-center justify-center mb-8 ring-1 ring-white/5 shadow-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-[#52525b]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Your Messages</h3>
                        <p className="text-[#a1a1aa] max-w-sm text-lg leading-relaxed">
                            Select a conversation from the list to start chatting.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;