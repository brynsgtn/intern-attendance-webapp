import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
    },
    middle_initial: {
        type: String,
        required: false,
    },
    last_name: {
        type: String,
        required: true,
    },
    full_name: {
        type: String,
        default: function () {
            return `${this.last_name}, ${this.first_name} ${this.middle_initial}`;
        },
    },
    email: {
        type: String,
        required: true,
        unique: true, // Unique constraint for email
    },
    password: {
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
    team: {
        type: String, // For dropdown options
        required: true,
    },
    image: {
        type: String, // Path to the user's image (optional)
        default: null,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isTeamLeader: {
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