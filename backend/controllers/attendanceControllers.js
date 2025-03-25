import { Attendance } from '../models/attendanceModel.js';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

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