import genToken from "../config/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"

export const signup = async (req, res) => {
    try {
        const {name, email, password, username} = req.body

        const findByEmail = await User.findOne({email})
        
        if (findByEmail) {
            return res.status(400).json({
                message: "Email already exists!"
            })
        }

        const findByUsername = await User.findOne({username})

        if (findByUsername) {
            return res.status(400).json({
                message: "Username already exists!"
            })
        }

        if(password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters!"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            email,
            username,
            password: hashedPassword
        })

        const token = await genToken(user._id)
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 10 * 365 * 24 * 60 * 60 * 1000, 
            secure: false,
            sameSite: "Strict"
        })

        return res.status(201).json(user)
    }
    catch(error) {
        return res.status(500).json({
            message: `Signup error ${error}`
        })
    }
}


export const signIn = async (req, res) => {
    try {
        const {password, username} = req.body

        const user = await User.findOne({username})

        if (!user) {
            return res.status(400).json({
                message: "User not found!"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect password!"
            })
        }

        const token = await genToken(user._id)
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 10 * 365 * 24 * 60 * 60 * 1000, 
            secure: false,
            sameSite: "Strict"
        })

        return res.status(200).json(user)
    }
    catch(error) {
        return res.status(500).json({
            message: `SignIn error ${error}`
        })
    }
}


export const signOut = async (req, res) => {
    try {
        res.clearCookie("token")
        return res.status(200).json({
            message: "Signed out successfully!"
        })
    }
    catch(error) {
        return res.status(500).json({
            message: `SignOut error ${error}`
        })
    }
}