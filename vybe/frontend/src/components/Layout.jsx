import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { FaHome, FaSearch, FaPlusSquare, FaUser, FaSignOutAlt } from "react-icons/fa";
import { RiMovieLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive(to) ? "text-white font-bold scale-105" : "text-gray-400 hover:text-white"
                }`}
        >
            <Icon size={22} className={`transition-transform duration-300 ${isActive(to) ? "scale-110" : "group-hover:scale-110"}`} />
            <span className="hidden lg:block text-[15px]">{label}</span>
        </Link>
    );

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col w-20 lg:w-72 h-full border-r border-white/10 py-8 px-3 lg:px-6 transition-all duration-300">

                {/* Logo Section */}
                <div className="mb-32 px-2 lg:px-2 flex justify-center lg:justify-start">
                    <Link to="/" className="flex items-center gap-4">
                        <img
                            src="/astrix_logo.png"
                            alt="Astrix"
                            className="w-10 h-10 object-contain"
                        />
                        <span className="hidden lg:block text-2xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            ASTRIX
                        </span>
                    </Link>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 flex flex-col gap-6 items-center lg:items-stretch">
                    <NavItem to="/" icon={FaHome} label="Home" />
                    <NavItem to="/search" icon={FaSearch} label="Search" />
                    <NavItem to="/create" icon={FaPlusSquare} label="Create" />
                    <NavItem to="/reels" icon={RiMovieLine} label="Reels" />
                    <NavItem to="/profile" icon={FaUser} label="Profile" />
                </nav>

                {/* Logout Button */}
                <div className="mt-auto pt-8 border-t border-white/10">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-3.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all justify-center lg:justify-start"
                    >
                        <FaSignOutAlt size={22} />
                        <span className="hidden lg:block text-[15px]">Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 h-full overflow-y-auto relative scrollbar-hide bg-black">
                {/* Mobile Header with Logo */}
                <div className="md:hidden sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
                    <Link to="/" className="flex items-center justify-center gap-2">
                        <img
                            src="/astrix_logo.png"
                            alt="Astrix"
                            className="w-8 h-8 object-contain"
                        />
                        <span className="text-xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent tracking-[0.15em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            ASTRIX
                        </span>
                    </Link>
                </div>
                <div className="w-full min-h-full pb-20 md:pb-0">
                    <Outlet />
                </div>
            </main>

            {/* MOBILE BOTTOM NAV */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full glass-heavy border-t border-white/10 z-50 pb-safe">
                <div className="flex justify-around items-center h-[70px] px-2">
                    <Link to="/" className={`p-3 rounded-2xl transition-all ${isActive("/") ? "text-white bg-white/10 scale-110" : "text-gray-400"}`}>
                        <FaHome size={24} />
                    </Link>
                    <Link to="/search" className={`p-3 rounded-2xl transition-all ${isActive("/search") ? "text-white bg-white/10 scale-110" : "text-gray-400"}`}>
                        <FaSearch size={24} />
                    </Link>
                    <Link to="/create" className={`p-3 rounded-2xl transition-all ${isActive("/create") ? "text-white bg-white/10 scale-110" : "text-gray-400"}`}>
                        <FaPlusSquare size={24} />
                    </Link>
                    <Link to="/reels" className={`p-3 rounded-2xl transition-all ${isActive("/reels") ? "text-white bg-white/10 scale-110" : "text-gray-400"}`}>
                        <RiMovieLine size={24} />
                    </Link>
                    <Link to="/profile" className={`p-3 rounded-2xl transition-all ${isActive("/profile") ? "text-white bg-white/10 scale-110" : "text-gray-400"}`}>
                        <FaUser size={24} />
                    </Link>
                </div>
            </nav>

        </div>
    );
};

export default Layout;