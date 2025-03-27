import { Attendance } from '../models/attendanceModel.js';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { User } from "../models/userModel.js";

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const PH_TIMEZONE = 'Asia/Manila';

// TIME IN CONTROLLER
export const timeIn = async (req, res) => {
    try {
        const { user_id } = req.body;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if there's already an attendance record for today
        const todayStart = dayjs().tz(PH_TIMEZONE).startOf('day').toDate();
        const todayEnd = dayjs().tz(PH_TIMEZONE).endOf('day').toDate();

        let attendance = await Attendance.findOne({
            user_id,
            created_at: { $gte: todayStart, $lte: todayEnd }
        });

        if (attendance) {
            if (attendance.time_in) {
                return res.status(400).json({ message: "Already timed in today." });
            }
            attendance.time_in = dayjs().tz(PH_TIMEZONE).toDate();
        } else {
            // Create new attendance record
            attendance = new Attendance({
                user_id,
                time_in: dayjs().tz(PH_TIMEZONE).toDate(),
            });
        }

        await attendance.save();

        res.status(200).json({
            message: "Time-in recorded successfully (PST).",
            attendance
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const timeOut = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ message: "User not found" });
        }

        const todayStart = dayjs().tz(PH_TIMEZONE).startOf('day').toDate();
        const todayEnd = dayjs().tz(PH_TIMEZONE).endOf('day').toDate();

        let attendance = await Attendance.findOne({
            user_id,
            created_at: { $gte: todayStart, $lte: todayEnd }
        });

        if (!attendance || !attendance.time_in) {
            return res.status(400).json({ message: "You must time-in first." });
        }

        if (attendance.time_out) {
            return res.status(400).json({ message: "Already timed out today." });
        }

        // Set time out
        attendance.time_out = dayjs().tz(PH_TIMEZONE).toDate();

        // Compute total hours
        const timeInPH = dayjs(attendance.time_in).tz(PH_TIMEZONE);
        const timeOutPH = dayjs(attendance.time_out).tz(PH_TIMEZONE);

        let totalHours = timeOutPH.diff(timeInPH, 'hour', true); // true = float result

        if (totalHours >= 4) {
            totalHours = totalHours - 1; // Deduct 1 hour lunch
        }

        // Optional: Round to 2 decimal places
        attendance.total_hours = parseFloat(totalHours.toFixed(2));

        await attendance.save();

        res.status(200).json({
            message: `Time-out recorded successfully (PST). Total hours: ${attendance.total_hours} hrs.`,
            attendance
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

export const getUserAttendance = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "User not found" });
        }

        // Fetch attendance data for the user
        const attendance = await Attendance.find({ user_id: userId });

        if (!attendance || attendance.length === 0) {
            return res.status(404).json({ message: "No attendance records found" });
        }

        // Format time_in and time_out to Philippine Time (Asia/Manila)
        const formattedAttendance = attendance.map((record) => {
            let time_in = dayjs(record.time_in).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
            let time_out = record.time_out ? dayjs(record.time_out).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss') : null;

            // Calculate total hours worked (deduct 1 hour if more than 4 hours)
            let totalHours = 0;

            if (time_in && time_out) {
                const timeInPH = dayjs(record.time_in).tz(PH_TIMEZONE);
                const timeOutPH = dayjs(record.time_out).tz(PH_TIMEZONE);
                totalHours = timeOutPH.diff(timeInPH, 'hour', true);

                if (totalHours >= 5) {
                    totalHours -= 1; // Deduct 1 hour for lunch break
                } else if (totalHours >= 4 && totalHours < 5) {
                    totalHours = 4; // Set total hours to exactly 4
                }
            }


            // Add Full-day/Half-day flag
            const dayStatus = totalHours >= 4 ? 'Full-day' : 'Half-day';

            return {
                ...record.toObject(),
                time_in,
                time_out,
                total_hours: totalHours.toFixed(2),
                day_status: dayStatus,
            };
        });

        res.status(200).json({ attendance: formattedAttendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

const validateDateTime = (date, time) => {
    if (!date || !time) {
        return { valid: false, message: "Date and time are required." };
    }

    const parsedDate = dayjs(date, "YYYY-MM-DD", true);
    if (!parsedDate.isValid()) {
        return { valid: false, message: "Invalid date format. Use YYYY-MM-DD." };
    }

    const dateTime = dayjs.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", PH_TIMEZONE);
    if (!dateTime.isValid()) {
        return { valid: false, message: "Invalid time format. Use HH:mm (24-hour format)." };
    }

    return { valid: true, dateTime };
};

const updateAttendanceTime = async (req, res, type) => {
    try {
        const { date, time_in, time_out, request_reason } = req.body;
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Adjust the selected date to Philippine time (UTC+8)
        const selectedDateStart = dayjs(date).tz("Asia/Manila").startOf("day").toDate();
        const selectedDateEnd = dayjs(date).tz("Asia/Manila").endOf("day").toDate();

        let attendance = await Attendance.findOne({
            user_id: userId,
            created_at: { $gte: selectedDateStart, $lte: selectedDateEnd }
        });

        if (!attendance) {
            return res.status(404).json({ message: "No attendance record found for the selected date." });
        }

        const { valid: validTimeIn, dateTime: timeInDateTime, message: timeInMessage } = validateDateTime(date, time_in);
        const { valid: validTimeOut, dateTime: timeOutDateTime, message: timeOutMessage } = validateDateTime(date, time_out);

        if (type === "time_in") {
            if (!validTimeIn) return res.status(400).json({ message: timeInMessage });

            if (attendance.pending_time_out && timeInDateTime.isAfter(dayjs(attendance.pending_time_out))) {
                return res.status(400).json({ message: "Time-in cannot be later than the recorded time-out." });
            }

            attendance.pending_time_in = timeInDateTime.tz("Asia/Manila").toDate();
            attendance.request_reason = request_reason;
        } 
        else if (type === "time_out") {
            if (!validTimeOut) return res.status(400).json({ message: timeOutMessage });

            if (attendance.pending_time_in && timeOutDateTime.isBefore(dayjs(attendance.pending_time_in))) {
                return res.status(400).json({ message: "Time-out cannot be earlier than the recorded time-in." });
            }

            attendance.pending_time_out = timeOutDateTime.tz("Asia/Manila").toDate();
            attendance.request_reason = request_reason;
        }

        attendance.status = "pending";
        await attendance.save();

        res.status(200).json({
            message: `${type.replace("_", "-")} update is pending approval.`,
            attendance
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateTimeIn = (req, res) => updateAttendanceTime(req, res, "time_in");

export const updateTimeOut = (req, res) => updateAttendanceTime(req, res, "time_out");

export const approveAttendance = async (req, res) => {
    try {
        const { date } = req.body;
        const { userId } = req.params;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Validate and parse date, adjust to Philippine time
        const parsedDate = dayjs(date, "YYYY-MM-DD", true).tz("Asia/Manila");
        if (!parsedDate.isValid()) {
            return res.status(400).json({
                message: "Invalid date format. Use YYYY-MM-DD.",
                details: "Date could not be parsed"
            });
        }

        const selectedDateStart = parsedDate.startOf('day').toDate();
        const selectedDateEnd = parsedDate.endOf('day').toDate();

        // Find the attendance record
        let attendance = await Attendance.findOne({
            user_id: userId,
            created_at: { $gte: selectedDateStart, $lte: selectedDateEnd }
        });

        if (!attendance) {
            return res.status(404).json({ message: "No attendance record found for the selected date." });
        }

        // Ensure time-out is either null or later than time-in
        if (attendance.pending_time_out && attendance.pending_time_out <= attendance.pending_time_in) {
            return res.status(400).json({
                message: "Time-out must be later than time-in or null.",
                details: "Invalid time-out update request."
            });
        }

        // Approve time-in if pending
        if (attendance.pending_time_in) {
            attendance.time_in = attendance.pending_time_in;
            attendance.pending_time_in = null;
        }

        // Approve time-out if pending
        if (attendance.pending_time_out) {
            attendance.time_out = attendance.pending_time_out;
            attendance.pending_time_out = null;
        }

        // Update status and remove request reason
        attendance.status = "approved";
        attendance.request_reason = null;

        // Save the updated attendance
        await attendance.save();

        res.status(200).json({
            message: "Attendance has been approved successfully.",
            attendance
        });

    } catch (error) {
        console.error("Error Details:", {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack
        });

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const rejectAttendance = async (req, res) => {
    try {
        const { date, reason } = req.body;
        const { userId } = req.params;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Validate and parse date, adjust to Philippine time
        const parsedDate = dayjs(date, "YYYY-MM-DD", true).tz("Asia/Manila");
        if (!parsedDate.isValid()) {
            return res.status(400).json({
                message: "Invalid date format. Use YYYY-MM-DD.",
                details: "Date could not be parsed"
            });
        }

        const selectedDateStart = parsedDate.startOf('day').toDate();
        const selectedDateEnd = parsedDate.endOf('day').toDate();

        // Find the attendance record
        let attendance = await Attendance.findOne({
            user_id: userId,
            created_at: { $gte: selectedDateStart, $lte: selectedDateEnd }
        });

        if (!attendance) {
            return res.status(404).json({ message: "No attendance record found for the selected date." });
        }

        // Reject the attendance
        attendance.status = 'rejected';

        // If there's a pending time-out, set it to null
        if (attendance.pending_time_out) {
            attendance.pending_time_out = null;
        }

        // Set the rejection reason
        attendance.rejection_reason = reason;

        // Set the pending time-in to null or update with time-in if available
        if (attendance.pending_time_in) {
            attendance.pending_time_in = null;
        }

        // Save the updated attendance
        await attendance.save();

        res.status(200).json({
            message: "Attendance has been rejected successfully.",
            attendance
        });

    } catch (error) {
        console.error('Error Details:', {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack
        });

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const getAllAttendance = async (req, res) => {
    try {
        // Fetch attendance and populate the user_id field with the corresponding user data
        const attendanceRecords = await Attendance.find()
            .populate('user_id', 'first_name last_name email school team') // Specify the fields you want to populate
            .exec();

        // Return the attendance records in JSON format
        return res.json({
            success: true,
            data: attendanceRecords,
        });
    } catch (error) {
        console.error("Error fetching attendance with user data:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching attendance records.",
        });
    }
};

export const getAllTeamMembersAttendance = async (req, res) => {
    try {
        // Get the requesting user
        const requestingUser = req.user;

        // Check if the user is a team leader or admin
        if (!requestingUser.isTeamLeader && !requestingUser.isAdmin) {
            return res.status(403).json({ 
                message: "Only team leaders and admins can access team members' attendance." 
            });
        }

        // Determine the query based on user role
        const teamQuery = requestingUser.isTeamLeader 
            ? { team: requestingUser.team }
            : {};

        // Find team members
        const teamMembers = await User.find(teamQuery);

        // Fetch attendance records for team members
        const attendanceRecords = await Attendance.find({
            user_id: { $in: teamMembers.map(member => member._id) }
        })
        .populate('user_id', 'first_name last_name email school team full_name')
        .sort({ created_at: -1 }); // Sort by most recent first

        // Format attendance records
        const formattedAttendance = attendanceRecords.map(record => {
            // Format times to Philippine Time
            const timeIn = record.time_in 
                ? dayjs(record.time_in).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss') 
                : null;
            const timeOut = record.time_out 
                ? dayjs(record.time_out).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss') 
                : null;

            return {
                _id: record._id,
                user: {
                    _id: record.user_id._id,
                    full_name: record.user_id.full_name,
                    email: record.user_id.email,
                    school: record.user_id.school,
                    team: record.user_id.team
                },
                time_in: timeIn,
                time_out: timeOut,
                total_hours: record.total_hours,
                status: record.status,
                created_at: dayjs(record.created_at).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                request_reason: record.request_reason,
                rejection_reason: record.rejection_reason
            };
        });

        res.status(200).json({
            message: "Team members' attendance retrieved successfully",
            count: formattedAttendance.length,
            attendance: formattedAttendance
        });

    } catch (error) {
        console.error('Error in getAllTeamMembersAttendance:', error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

export const getUserRemainingHours = async (req, res) => {
    try {
        // Get the requesting user
        const requestingUser = req.user;
        console.log("User making request:", req.user); // Debugging log
        // Check if the user is a team leader or admin
        if (!requestingUser.isTeamLeader && !requestingUser.isAdmin) {
            return res.status(403).json({ 
                message: "Only team leaders and admins can view remaining hours." 
            });
        }

        // Determine the query based on user role
        const teamQuery = requestingUser.isTeamLeader 
            ? { team: requestingUser.team }
            : {};

        // Find team members
        const teamMembers = await User.find(teamQuery);

        // Aggregate to calculate remaining hours
        const memberHoursDetails = await Promise.all(
            teamMembers.map(async (member) => {
                // Calculate total hours worked
                const attendanceRecords = await Attendance.find({ 
                    user_id: member._id,
                    status: { $in: ['completed', 'approved'] }
                });

                const totalHoursWorked = attendanceRecords.reduce(
                    (total, record) => total + (record.total_hours || 0), 
                    0
                );

                // Calculate remaining hours
                const remainingHours = Math.max(
                    member.required_hours - totalHoursWorked, 
                    0
                );

                return {
                    user: {
                        _id: member._id,
                        full_name: member.full_name,
                        email: member.email,
                        team: member.team,
                        school: member.school
                    },
                    required_hours: member.required_hours,
                    total_hours_worked: parseFloat(totalHoursWorked.toFixed(2)),
                    remaining_hours: parseFloat(remainingHours.toFixed(2)),
                    completion_percentage: parseFloat(
                        ((totalHoursWorked / member.required_hours) * 100).toFixed(2)
                    )
                };
            })
        );

        // Sort members by remaining hours (descending)
        const sortedMemberHours = memberHoursDetails.sort(
            (a, b) => b.remaining_hours - a.remaining_hours
        );

        res.status(200).json({
            message: "Member remaining hours retrieved successfully",
            count: sortedMemberHours.length,
            members: sortedMemberHours
        });

    } catch (error) {
        console.error('Error in getUserRemainingHours:', error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

export const filterAttendanceByName = async (req, res) => {
    try {
        // Get the requesting user
        const requestingUser = req.user;

        // Get query parameters
        const { name } = req.query;

        // Check if the user is a team leader or admin
        if (!requestingUser.isTeamLeader && !requestingUser.isAdmin) {
            return res.status(403).json({ 
                message: "Only team leaders and admins can filter attendance." 
            });
        }

        // Build user query based on name and user role
        const userQuery = {
            ...(requestingUser.isTeamLeader ? { team: requestingUser.team } : {}),
            $or: [
                { first_name: { $regex: name, $options: 'i' } },
                { last_name: { $regex: name, $options: 'i' } },
                { full_name: { $regex: name, $options: 'i' } }
            ]
        };

        // Find matching users
        const matchingUsers = await User.find(userQuery);

        // If no users found, return empty result
        if (matchingUsers.length === 0) {
            return res.status(200).json({
                message: "No users found matching the search criteria",
                count: 0,
                attendance: []
            });
        }

        // Fetch attendance records for matching users
        const attendanceRecords = await Attendance.find({
            user_id: { $in: matchingUsers.map(user => user._id) }
        })
        .populate('user_id', 'first_name last_name email school team full_name required_hours')
        .sort({ created_at: -1 });

        // Format attendance records
        const formattedAttendance = attendanceRecords.map(record => ({
            _id: record._id,
            user: {
                _id: record.user_id._id,
                full_name: record.user_id.full_name,
                email: record.user_id.email,
                school: record.user_id.school,
                team: record.user_id.team
            },
            time_in: record.time_in 
                ? dayjs(record.time_in).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss') 
                : null,
            time_out: record.time_out 
                ? dayjs(record.time_out).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss') 
                : null,
            total_hours: record.total_hours,
            status: record.status,
            created_at: dayjs(record.created_at).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
        }));

        res.status(200).json({
            message: "Attendance records filtered by name retrieved successfully",
            count: formattedAttendance.length,
            attendance: formattedAttendance
        });

    } catch (error) {
        console.error('Error in filterAttendanceByName:', error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

// Filter by date(tl and admin?) - filter specific date
// viewAllEditRequest(admin) - view all edit request
// SendEmail for edit request(mailtrap to admin) - to be placed inside updateTimeIn and updateTimeOut
// SendEmail for approved on denied request(mailtrap to member) -
// sendEmail Completion (mailtrap to member)