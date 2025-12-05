import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import axios from "axios";
import { serverUrl } from "../App";
import { useAuth } from "../context/AuthContext";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/signup`,
        {
          name,
          email,
          username,
          password,
        },
        { withCredentials: true }
      );

      if (res.status === 201) {
        // Remove password before storing
        const { password, ...userWithoutPassword } = res.data;
        login(userWithoutPassword);
        navigate("/");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="w-full max-w-[450px] space-y-8 relative z-10 p-12 luxury-card border-white/10 shadow-2xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img
              src="/astrix_logo.png"
              alt="Astrix"
              className="w-12 h-12 object-contain"
              style={{ width: '48px', height: '48px' }}
            />
            <span className="text-2xl font-bold text-gray-100 tracking-[0.3em]">ASTRIX</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create an account</h1>
          <p className="text-gray-400 text-sm font-medium">Enter your information to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="luxury-input border-white/10 focus:border-white/30 placeholder:text-gray-500"
              placeholder="Full Name"
              required
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="luxury-input border-white/10 focus:border-white/30 placeholder:text-gray-500"
              placeholder="Username"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="luxury-input border-white/10 focus:border-white/30 placeholder:text-gray-500"
              placeholder="Email"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="luxury-input border-white/10 focus:border-white/30 placeholder:text-gray-500 pr-10"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-white hover:text-cyan-400 transition-colors"
              >
                {showPassword ? <IoMdEyeOff size={18} /> : <IoMdEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-luxury w-full py-4 text-sm tracking-widest hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]"
            disabled={loading}
          >
            {loading ? "Creating account..." : "SIGN UP"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm relative z-50 mt-10">
          Already have an account?{' '}
          <Link to="/signin" className="text-white font-bold hover:text-cyan-300 hover:underline decoration-2 underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
