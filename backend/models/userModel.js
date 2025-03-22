import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Unique constraint for email
    },
    password: {
        type: String,
        required: true,
    },
    team: {
        type: String, // For dropdown options
        default: null, // Default value when no team is selected
    },
    first_name: {
        type: String,
        required: true,
    },
    last_name: {
        type: String,
        required: true,
    },
    school: {
        type: String, // New field for school
        required: true,
    },
    required_hours: {
        type: Number, // Number of hours required for the user
        required: true, // This field is now required
    },
    image: {
        type: String, // Path to the user's image (optional)
        default: null,
    },
    full_name: {
        type: String,
        default: function () {
            return `${this.first_name} ${this.last_name}`;
        },
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
},
    {
        timestamps: true
    }
);

export const User = mongoose.model('User', userSchema);