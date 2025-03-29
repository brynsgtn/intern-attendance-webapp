import bcryptjs from "bcryptjs";
import crypto from "crypto";
import fs from 'fs/promises';
import path from 'path';

import { User } from "../models/userModel.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendResetSuccessEmail
} from "../mailtrap/emails.js";

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
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        };
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        };

        if (!user.isVerified) {
            return res.status(400).json({ success: false, message: "User not verified" });
        };

        generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("error in verifyEmail", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        await user.save();

        // send email
        await sendPasswordResetEmail(user.email, user.first_name, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

        res.status(200).json({ success: true, message: "Password reset link sent to your email" });
    } catch (error) {
        console.log("Error in forgotPassword ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        // update password
        const hashedPassword = await bcryptjs.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;

        await user.save();

        await sendResetSuccessEmail(user.email, user.first_name);

        res.status(200).json({ success: true, message: "Password reset successful" });

    } catch (error) {
        console.log("Error in resetPassword", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.log("Error in checkAuth", error);
        res.status(400).json({ success: false, message: error.message });
    };
};

export const resendVerificationEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'User is already verified' });
        }

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

        await user.save();

        await sendVerificationEmail(user.email, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification email resent successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { user_id, role } = req.body;
        const requestingUser = req.user; // Assuming authentication middleware adds `req.user`

        // Validate input
        if (!user_id || !role) {
            return res.status(400).json({ message: "User ID and role are required." });
        }

        // Check if the requesting user is an admin
        if (!requestingUser?.isAdmin) {
            return res.status(403).json({ message: "Only admins can update user roles." });
        }

        // Fetch the user to be updated
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Handle role assignment
        if (role === "ADMIN") {
            user.isAdmin = true;
            user.isTeamLeader = false;
            user.isFinished = false;
        } else if (role === "TEAM_LEADER") {
            user.isAdmin = false;
            user.isTeamLeader = true;
            user.isFinished = false;
        } else if (role === "MEMBER") {
            user.isAdmin = false;
            user.isTeamLeader = false;
            user.isFinished = false;
        } else if (role === "FINISHED") {
            user.isFinished = true;
            user.isAdmin = false;
            user.isTeamLeader = false;
        } else {
            return res.status(400).json({ message: "Invalid role selection. Choose 'ADMIN', 'TEAM_LEADER', or 'MEMBER'." });
        }

        await user.save();
        res.status(200).json({ message: `User role updated successfully to ${role}.` });

    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
}

// USER ONLY
export const updateUserProfile = async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        console.log('Request File:', req.file);

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Handle file upload
        let newImage = user.image; // Default to existing image
        if (req.file) {
            newImage = req.file.filename;

            // Optional: Delete old image if exists
            if (user.image) {
                try {
                    const oldFilePath = path.join(process.cwd(), 'public/images', user.image);
                    // Check if the file exists before attempting to delete
                    if (fs.existsSync(oldFilePath)) {
                        await fs.promises.unlink(oldFilePath);  // Delete the old image asynchronously
                        console.log(`Old image ${user.image} deleted.`);
                    }
                } catch (err) {
                    console.log('Old file deletion error:', err);
                }
            }
        }

        // Update user fields
        user.first_name = req.body.first_name || user.first_name;
        user.middle_initial = req.body.middle_initial || user.middle_initial;
        user.last_name = req.body.last_name || user.last_name;
        user.email = req.body.email || user.email;
        user.school = req.body.school || user.school;
        user.required_hours = req.body.required_hours || user.required_hours;
        user.team = req.body.team || user.team;
        user.image = newImage;

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            first_name: updatedUser.first_name,
            middle_initial: updatedUser.middle_initial,
            last_name: updatedUser.last_name,
            email: updatedUser.email,
            school: updatedUser.school,
            required_hours: updatedUser.required_hours,
            team: updatedUser.team,
            image: updatedUser.image,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
};

// ADMIN ONLY
export const adminUpdateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const requestingUser = req.user; // Assuming authentication middleware adds `req.user`

        // Check if the requesting user is an admin
        if (!requestingUser?.isAdmin) {
            return res.status(403).json({ message: "Only admins can update other user profiles." });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Update fields
        user.first_name = req.body.first_name || user.first_name;
        user.middle_initial = req.body.middle_initial || user.middle_initial;
        user.last_name = req.body.last_name || user.last_name;
        user.email = req.body.email || user.email;
        user.school = req.body.school || user.school;
        user.required_hours = req.body.required_hours || user.required_hours;
        user.team = req.body.team || user.team;

        await user.save();
        res.status(200).json({ message: "User profile updated successfully.", user });
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
};
