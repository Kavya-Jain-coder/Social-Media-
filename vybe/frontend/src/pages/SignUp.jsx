import React, { useState } from "react";
import logo3 from "../assets/logo3.png";
import logo4 from "../assets/logo4.png";
import { IoIosEye } from "react-icons/io";
import { IoIosEyeOff } from "react-icons/io";
import axios from "axios";
import { serverUrl } from "../App";
function SignUp() {
  const [inputClicked, setInputClicked] = useState({
    name: false,
    username: false,
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const result = await axios.post(`${serverUrl}/api/auth/signup`, {
        name,
        username,
        email,
        password,
      }, {withCredentials: true});
      console.log(result.data);
    }
    catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="w-full h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col justify-center items-center">
      <div className="w-[90%] lg:max-w-[60%] h-[600px] bg-white rounded-2xl flex justify-center items-center overflow-hidden border-2 border-[#1a1f23] ">
        <div className="w-full lg:w-[50%] h-full bg-white flex flex-col items-center p-[10px] gap-[20px]">
          <div className="flex gap-[10px] items-center text-[20px] font-semibold mt-[40px] ">
            <span>Sign Up to</span>
            <img src={logo3} alt="" className="w-[70px] " />
          </div>

          <div
            className="relative flex items-center justify-start w-[90%] h-[50px] rounded-2xl mt-[30px] border-2 border-black "
            onClick={() => setInputClicked({ ...inputClicked, name: true })}
          >
            <label
              htmlFor="name"
              className={`text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] ${
                inputClicked.name ? "top-[-15px]" : ""
              } `}
            >
              Enter Your Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full h-full rounded-2xl px-[20px] outline-none border-0  "
              required
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div
            className="relative flex items-center justify-start w-[90%] h-[50px] rounded-2xl  border-2 border-black "
            onClick={() => setInputClicked({ ...inputClicked, username: true })}
          >
            <label
              htmlFor="username"
              className={`text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] ${
                inputClicked.username ? "top-[-15px]" : ""
              } `}
            >
              Enter User Name
            </label>
            <input
              type="text"
              id="username"
              className="w-full h-full rounded-2xl px-[20px] outline-none border-0  "
              required
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div
            className="relative flex items-center justify-start w-[90%] h-[50px] rounded-2xl border-2 border-black "
            onClick={() => setInputClicked({ ...inputClicked, email: true })}
          >
            <label
              htmlFor="email"
              className={`text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] ${
                inputClicked.email ? "top-[-15px]" : ""
              } `}
            >
              Enter Your Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full h-full rounded-2xl px-[20px] outline-none border-0  "
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div
            className="relative flex items-center justify-start w-[90%] h-[50px] rounded-2xl border-2 border-black "
            onClick={() => setInputClicked({ ...inputClicked, password: true })}
          >
            <label
              htmlFor="password"
              className={`text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] ${
                inputClicked.password ? "top-[-15px]" : ""
              } `}
            >
              Enter Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="w-full h-full rounded-2xl px-[20px] outline-none border-0  "
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            {!showPassword ? (
              <IoIosEye
                className="absolute cursor-pointer right-[20px] w-[25px] h-[25px]"
                onClick={() => setShowPassword(true)}
              />
            ) : (
              <IoIosEyeOff
                className="absolute cursor-pointer right-[20px] w-[25px] h-[25px]"
                onClick={() => setShowPassword(false)}
              />
            )}
          </div>

          <button className="w-[70%] px-[20px] py-[10px] bg-black text-white font-semibold h-[50px] cursor-pointer rounded-2xl mt-[30px]" onClick={handleSignup}>
            Sign Up
          </button>
          <p className="cursor-pointer text-gray-800">
            Already have an account?{" "}
            <span className="border-b-2 border-b-black pb-[3px] text-black ">
              Sign In
            </span>
          </p>
        </div>

        <div className="md:w-[50%] h-full hidden lg:flex justify-center items-center bg-[#000000] flex-col gap-[10px] text-white text-[16px] font-semibold rounded-l-[30px] shadow-2xl shadow-black ">
          <img src={logo4} className="w-[40%]" alt="" />
          <p>Not Just A Platform, It's A VYBE </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
