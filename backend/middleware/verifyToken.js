import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
        }

        // Fetch user details from the database
        const user = await User.findById(decoded.userId).select("-password"); // Exclude password for security

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Attach user object to request
        req.user = user;
        next();
    } catch (error) {
        console.error("Error in verifyToken:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
