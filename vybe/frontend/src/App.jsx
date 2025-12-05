import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'

export const serverUrl = "http://localhost:8002";

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Reels from './pages/Reels.jsx'
import Chat from './pages/Chat.jsx'
import Profile from './pages/Profile.jsx'
import UserProfile from './pages/UserProfile.jsx'
import Create from './pages/Create.jsx'
import Search from './pages/Search.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="bg-[#09090b] h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#27272a] border-t-white rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/signin" />;

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="bg-[#09090b] h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#27272a] border-t-white rounded-full animate-spin"></div>
    </div>
  );

  if (user) return <Navigate to="/" />;

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/create" element={<Create />} />
          <Route path="/search" element={<Search />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
