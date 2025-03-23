import { User } from "../models/userModel.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/emails.js";

export const signup = async (req, res) => {
    const { first_name, middle_initial, last_name, email, password, school, required_hours, team } = req.body;

    try {
        if (!first_name || !last_name || !email || !password || !school || !required_hours || !team) {
            throw new Error("All fields are required");
        };

        const userAlreadyExists = await User.findOne({ email });

        if (userAlreadyExists) {
            return res.status(404).json({ message: "User already exists" });
        };

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            first_name,
            middle_initial,
            last_name,
            email,
            password: hashedPassword,
            school,
            required_hours,
            team,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        });

        await user.save();

        // jwt
        generateTokenAndSetCookie(res, user._id);
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    const { code } = req.body;

    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
        };

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });

    } catch (error) {
        console.log("error in verifyEmail", error);
        res.status(500).json({ success: false, message: "Server error" });
    };
};

export const login = async (req, res) => {
    res.send("Login");
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgetPassword = async (req, res) => {
    res.send("Forget password");
};

export const resetPassword = async (req, res) => {
    res.send("Reset password");
};

export const checkAuth = async (req, res) => {
    res.send("Chek authorization");
};