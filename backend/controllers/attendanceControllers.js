import { Attendance } from '../models/attendanceModel.js';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { User } from "../models/userModel.js";
import { sendEditRequestEmail, sendApprovalDenialEmail } from '../mailtrap/emails.js';

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const PH_TIMEZONE = 'Asia/Manila';

// USER
export const timeIn = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if there's already an attendance record for today
        const todayStart = dayjs().tz(PH_TIMEZONE).startOf('day').toDate();
        const todayEnd = dayjs().tz(PH_TIMEZONE).endOf('day').toDate();

        let attendance = await Attendance.findOne({
            user_id: userId,
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
                user_id: userId,
                time_in: dayjs().tz(PH_TIMEZONE).toDate(),
                time_out: null,
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
// USER
export const timeOut = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "User not found" });
        }

        const todayStart = dayjs().tz(PH_TIMEZONE).startOf('day').toDate();
        const todayEnd = dayjs().tz(PH_TIMEZONE).endOf('day').toDate();

        let attendance = await Attendance.findOne({
            user_id: userId,
            created_at: { $gte: todayStart, $lte: todayEnd }
        });

        if (!attendance || !attendance.time_in) {
            return res.status(400).json({ message: "You must time-in first." });
        }

        if (attendance.time_out) {
            return res.status(400).json({ message: "Already timed out today." });
        }

        // Save actual time out (current time PH)
        const actualTimeOut = dayjs().tz(PH_TIMEZONE);
        attendance.time_out = actualTimeOut.toDate();

        const timeInPH = dayjs(attendance.time_in).tz(PH_TIMEZONE);

        // Set the minimum start counting time to 9:00 AM of the same day
        const nineAM = timeInPH.hour(9).minute(0).second(0).millisecond(0);
        const effectiveStartTime = timeInPH.isBefore(nineAM) ? nineAM : timeInPH;

        // Define cutoff time at 6:00 PM
        const sixPM = dayjs().tz(PH_TIMEZONE).hour(18).minute(0).second(0).millisecond(0);

        // Use the earlier between actual time-out and 6:00 PM
        const effectiveEndTime = actualTimeOut.isAfter(sixPM) ? sixPM : actualTimeOut;

        // Calculate total hours
        let totalHours = effectiveEndTime.diff(effectiveStartTime, 'hour', true);

        // Deduction rules
        if (totalHours > 5) {
            totalHours -= 1; // Deduct 1 hour for lunch
        } else if (totalHours > 4 && totalHours <= 5) {
            totalHours = 4;
        }

        attendance.total_hours = parseFloat(totalHours.toFixed(2));
        attendance.status = "completed";

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
// USER
export const getUserAttendance = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "User not found" });
        }

        // Fetch attendance data for the user
        const attendance = await Attendance.find({ user_id: userId }).sort({ created_at: -1 });

        if (!attendance || attendance.length === 0) {
            return res.status(404).json({ message: "No attendance records found" });
        }

        // Format time_in and time_out to Philippine Time (Asia/Manila)
        const formattedAttendance = attendance.map((record) => {
            let time_in = dayjs(record.time_in).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
            let time_out = dayjs(record.time_out).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');

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

// USER
const updateAttendanceTime = async (req, res) => {
    try {
        const { date, time_in, time_out, request_reason } = req.body;
        const { userId } = req.params;
        let change = null;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Fetch the user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const memberName = `${user.first_name} ${user.last_name}`;

        // Check if the user is an admin
        const isAdmin = user.isAdmin;

        // Adjust the selected date to Philippine time (UTC+8)
        const selectedDateStart = dayjs(date).tz("Asia/Manila").startOf("day").toDate();
        const selectedDateEnd = dayjs(date).tz("Asia/Manila").endOf("day").toDate();

        // Check if there is already a pending request for the attendance for non-admin users
        let attendance = await Attendance.findOne({
            user_id: userId,
            created_at: { $gte: selectedDateStart, $lte: selectedDateEnd }
        });

        if (!attendance) {
            return res.status(404).json({ message: "No attendance record found for the selected date." });
        }

        // If the user is not an admin, check if there is already a pending request
        if (!isAdmin && attendance.status === "pending") {
            return res.status(400).json({ message: "You already have a pending attendance request for this date." });
        }

        let timeInDateTime = null;
        let timeOutDateTime = null;
        let validTimeIn = true;
        let validTimeOut = true;
        let timeInMessage = "";
        let timeOutMessage = "";

        // Validate time_in if provided
        if (time_in) {
            const result = validateDateTime(date, time_in);
            validTimeIn = result.valid;
            timeInDateTime = result.dateTime;
            timeInMessage = result.message;

            // Check if time_in is before 9 AM
            const timeInHour = timeInDateTime.hour();
            if (timeInHour < 9) {
                return res.status(400).json({ message: "You can only edit attendance before 9 AM." });
            }
        }

        // Validate time_out if provided
        if (time_out) {
            const result = validateDateTime(date, time_out);
            validTimeOut = result.valid;
            timeOutDateTime = result.dateTime;
            timeOutMessage = result.message;

            // Check if time_out is before 9 AM
            const timeOutHour = timeOutDateTime.hour();
            if (timeOutHour < 9) {
                return res.status(400).json({ message: "You can only edit attendance before 9 AM." });
            }


            // Ensure time_out is greater than time_in
            if (timeOutDateTime.isBefore(timeInDateTime)) {
                return res.status(400).json({ message: "Time out cannot be earlier than time in." });
            }
        }


        // Handle Time-in validation
        if (time_in && !validTimeIn) {
            return res.status(400).json({ message: timeInMessage });
        }

        // Handle Time-out validation
        if (time_out && !validTimeOut) {
            return res.status(400).json({ message: timeOutMessage });
        }

        // Check if there are any changes
        let noChange = true;

        if (time_in && attendance.pending_time_in !== timeInDateTime.tz("Asia/Manila").toDate()) {
            noChange = false;
            change = "Time in";
            attendance.pending_time_in = timeInDateTime.tz("Asia/Manila").toDate();
        }

        if (time_out && attendance.pending_time_out !== timeOutDateTime.tz("Asia/Manila").toDate()) {
            noChange = false;
            if (change === "Time in") {
                change = "Time in and out"; // If time_in is already set, change to "Time in and out" when time_out is also provided
            } else {
                change = "Time out"; // Set change to "Time out" if only time_out is changed
            }
            attendance.pending_time_out = timeOutDateTime.tz("Asia/Manila").toDate();
        }

        if (request_reason && attendance.request_reason !== request_reason) {
            noChange = false;
            attendance.request_reason = request_reason;
        }

        if (noChange) {
            return res.status(400).json({ message: "No changes detected." });
        }

        // Admin logic: Directly approve the attendance and update the times
        if (isAdmin) {
            if (time_in) {
                attendance.pending_time_in = null;
                attendance.time_in = timeInDateTime.tz("Asia/Manila").toDate(); // Directly update the time_in
            }
            if (time_out) {
                attendance.pending_time_out = null;
                attendance.time_out = timeOutDateTime.tz("Asia/Manila").toDate(); // Directly update the time_out
            }
            attendance.status = "approved"; // Admin can approve directly
        } else {
            attendance.status = "pending"; // Non-admins need approval
        }

        // Calculate total hours as the difference between time_in and time_out
        if (attendance.time_in && attendance.time_out) {
            let diffInHours = dayjs(attendance.time_out).diff(dayjs(attendance.time_in), 'hour', true);

            // Apply lunch break or set total hours based on conditions
            if (diffInHours > 5) {
                diffInHours -= 1; // Deduct 1 hour for lunch
            } else if (diffInHours > 4 && diffInHours <= 5) {
                diffInHours = 4; // Set total hours to exactly 4
            }

            // Save the calculated total hours
            attendance.total_hours = diffInHours.toFixed(2); // Store total hours with 2 decimal places
        }



        await attendance.save();

        // If the user is not an admin, send an email to the admin for approval
        if (!isAdmin) {
            const admin = await User.findOne({ isAdmin: true }); // Find an admin
            if (admin) {
                const adminEmail = admin.email;
                // Send an email to the admin about the pending request
                // await sendEditRequestEmail(adminEmail, memberName, change, request_reason);
            }

            res.status(200).json({
                message: `${change ? change : "Attendance update"} is pending approval.`,
                attendance
            });
        } else {
            res.status(200).json({
                message: `${change ? change : "Attendance update"} has been updated.`,
                attendance
            });
        }



    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



// Unified route handler
export const updateAttendance = (req, res) => updateAttendanceTime(req, res);


// ADMIN ONLY
export const approveAttendance = async (req, res) => {
    try {
        const { date } = req.body;
        const { userId } = req.params;

        const requestingUser = req.user;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        if (!requestingUser.isAdmin) {
            return res.status(403).json({ message: "Only admins can approve requests." });
        }

        const parsedDate = dayjs(date, "YYYY-MM-DD", true).tz("Asia/Manila");
        if (!parsedDate.isValid()) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const selectedDateStart = parsedDate.startOf('day').toDate();
        const selectedDateEnd = parsedDate.endOf('day').toDate();

        let attendance = await Attendance.findOne({
            user_id: userId,
            created_at: { $gte: selectedDateStart, $lte: selectedDateEnd }
        });

        if (!attendance) {
            return res.status(404).json({ message: "No attendance record found for the selected date." });
        }

        let emailSent = false;
        let changeDetails = '';

        if (attendance.pending_time_in) {
            attendance.time_in = attendance.pending_time_in;
            attendance.pending_time_in = null;
            emailSent = true;
            changeDetails = 'Time-in updated';
        }

        if (attendance.pending_time_out) {
            attendance.time_out = attendance.pending_time_out;
            attendance.pending_time_out = null;
            emailSent = true;
            changeDetails = 'Time-out updated';
        }

        if (!emailSent) {
            return res.status(200).json({
                message: "No update required. No pending time-in or time-out changes found.",
                attendance
            });
        }

        // Calculate total hours
        if (attendance.time_in && attendance.time_out) {
            // Parse time_in and time_out in the Philippine timezone
            const timeInPH = dayjs(attendance.time_in).tz(PH_TIMEZONE);
            const timeOutPH = dayjs(attendance.time_out).tz(PH_TIMEZONE);

            // Calculate the total duration in hours as a floating-point number
            let totalHours = timeOutPH.diff(timeInPH, 'hour', true); // 'true' returns decimal value

            // Apply the lunch break deduction rules
            if (totalHours > 5) {
                totalHours -= 1; // Deduct 1 hour for lunch
            } else if (totalHours > 4 && totalHours <= 5) {
                totalHours = 4; // Set total hours to exactly 4
            }

            // Optional: Round to 2 decimal places
            attendance.total_hours = parseFloat(totalHours.toFixed(2));
        } else {
            attendance.total_hours = 0; // If no complete time in/out, reset total hours
        }

        attendance.status = "approved";
        attendance.request_reason = null;

        await attendance.save();

        res.status(200).json({
            message: "Attendance has been approved successfully.",
            attendance
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};



//ADMIN ONLY
export const rejectAttendance = async (req, res) => {
    try {
        const { date, reason } = req.body;
        const { userId } = req.params;

        // Get the requesting user
        const requestingUser = req.user;

        let rejectionReason = reason || "No reason provided"; // Default rejection reason

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Check if the user is admin
        if (!requestingUser.isAdmin) {
            return res.status(403).json({
                message: "Only admins can approve requests."
            });
        };

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
        const attendance = await Attendance.findOne({
            user_id: userId,
            created_at: { $gte: selectedDateStart, $lte: selectedDateEnd }
        });

        if (!attendance) {
            return res.status(404).json({ message: "No attendance record found for the selected date." });
        }

        // Check if there are any pending time-in or time-out updates
        if (!attendance.pending_time_in && !attendance.pending_time_out) {
            return res.status(400).json({ message: "No pending requests to reject." });
        }

        // Fetch the user details for sending the email
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const memberName = `${user.first_name} ${user.last_name}`;
        const memberEmail = user.email;

        // Update attendance status and related fields
        attendance.status = "rejected";  // Use a string for the status
        attendance.rejection_reason = rejectionReason;
        attendance.pending_time_in = null;
        attendance.pending_time_out = null;

        // Save the updated attendance
        await attendance.save();

        // Send the rejection email
        // await sendApprovalDenialEmail(memberEmail, memberName, attendance.status, rejectionReason);

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


//USER ONLY
//router.delete('/attendance/:userId', deleteAttendanceRecord);
export const deleteAttendanceRecord = async (req, res) => {
    try {
        const { date } = req.body;  // Date passed in request body
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const selectedDateStart = dayjs(date).tz("Asia/Manila").startOf("day").toDate();
        const selectedDateEnd = dayjs(date).tz("Asia/Manila").endOf("day").toDate();

        let attendance = await Attendance.findOne({
            user_id: userId,
            created_at: { $gte: selectedDateStart, $lte: selectedDateEnd }
        });

        if (!attendance) {
            return res.status(404).json({ message: "No attendance record found for the selected date." });
        }

        await Attendance.deleteOne({ _id: attendance._id });

        res.status(200).json({ message: "Attendance record deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



// ADMIN ONLY
export const getAllAttendance = async (req, res) => {
    try {

        // Get the requesting user
        const requestingUser = req.user;

        // Check if the user is admin
        if (!requestingUser.isAdmin) {
            return res.status(403).json({
                message: "Only admins can view all attendance."
            });
        };
        // Fetch attendance and populate the user_id field with the corresponding user data
        const attendanceRecords = await Attendance.find()
            .populate('user_id', 'first_name last_name email school team') // Specify the fields you want to populate
            .sort({ created_at: -1 })
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

// ADMIN and TEAM LEADERS ONLY
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

// ADMIN ONLY
export const getMemberRemainingHours = async (req, res) => {
    try {
      const requestingUser = req.user;
      const { memberId } = req.params;
  
      console.log("Requesting User:", requestingUser);
      console.log("Requested Member ID:", memberId);
  
      // Only admins are allowed
      if (!requestingUser.isAdmin) {
        return res.status(403).json({
          message: "Only admins can view remaining hours."
        });
      }
  
      // Fetch the member by ID
      const member = await User.findById(memberId);
  
      if (!member) {
        return res.status(404).json({
          message: "Member not found."
        });
      }
  
      // Fetch attendance records
      const attendanceRecords = await Attendance.find({
        user_id: member._id,
        status: { $in: ['completed', 'approved'] }
      });
  
      const totalHoursWorked = attendanceRecords.reduce(
        (total, record) => total + (record.total_hours || 0),
        0
      );
  
      const remainingHours = Math.max(member.required_hours - totalHoursWorked, 0);
  
      const result = {
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
  
      res.status(200).json({
        message: "Remaining hours retrieved successfully",
        member: result
      });
  
    } catch (error) {
      console.error("Error in getUserRemainingHours:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  };
  

// ADMIN and TEAM LEADERS ONLY
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

// ADMIN ONLY
export const viewAllEditRequests = async (req, res) => {
    try {
        // Get the requesting user
        const requestingUser = req.user;

        // Check if the user is an admin
        if (!requestingUser.isAdmin) {
            return res.status(403).json({
                message: "Only admins can view all edit requests."
            });
        }

        // Find all attendance records with pending edits
        const editRequests = await Attendance.find({
            $or: [
                { pending_time_in: { $ne: null } },
                { pending_time_out: { $ne: null } }
            ],
            status: 'pending'
        })
            .populate('user_id', 'first_name last_name email school team full_name')
            .sort({ created_at: -1 });

        // Format edit requests
        const formattedEditRequests = editRequests.map(record => ({
            _id: record._id,
            user: {
                _id: record.user_id._id,
                full_name: record.user_id.full_name,
                email: record.user_id.email,
                school: record.user_id.school,
                team: record.user_id.team
            },
            original_time_in: record.time_in
                ? dayjs(record.time_in).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
                : null,
            original_time_out: record.time_out
                ? dayjs(record.time_out).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
                : null,
            pending_time_in: record.pending_time_in
                ? dayjs(record.pending_time_in).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
                : null,
            pending_time_out: record.pending_time_out
                ? dayjs(record.pending_time_out).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
                : null,
            request_reason: record.request_reason,
            created_at: dayjs(record.created_at).tz(PH_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
        }));

        res.status(200).json({
            message: "Edit requests retrieved successfully",
            count: formattedEditRequests.length,
            edit_requests: formattedEditRequests
        });

    } catch (error) {
        console.error('Error in viewAllEditRequests:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// ADMIN and TEAM LEADERS ONLY
export const filterAttendanceByDate = async (req, res) => {
    try {
        // Get the requesting user
        const requestingUser = req.user;

        // Get query parameters
        const { date } = req.query;

        // Validate date parameter
        if (!date) {
            return res.status(400).json({
                message: "Date parameter is required"
            });
        }

        // Check if the user is a team leader or admin
        if (!requestingUser.isTeamLeader && !requestingUser.isAdmin) {
            return res.status(403).json({
                message: "Only team leaders and admins can filter attendance by date."
            });
        }

        // Parse and validate the date
        const parsedDate = dayjs(date, "YYYY-MM-DD", true).tz(PH_TIMEZONE);
        if (!parsedDate.isValid()) {
            return res.status(400).json({
                message: "Invalid date format. Use YYYY-MM-DD."
            });
        }

        // Determine the query based on user role
        const teamQuery = requestingUser.isTeamLeader
            ? { team: requestingUser.team }
            : {};

        // Find team members
        const teamMembers = await User.find(teamQuery);

        // Set date range for the entire day in Philippine timezone
        const dateStart = parsedDate.startOf('day').toDate();
        const dateEnd = parsedDate.endOf('day').toDate();

        // Fetch attendance records for team members on the specified date
        const attendanceRecords = await Attendance.find({
            user_id: { $in: teamMembers.map(member => member._id) },
            created_at: { $gte: dateStart, $lte: dateEnd }
        })
            .populate('user_id', 'first_name last_name email school team full_name')
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
            message: "Attendance records filtered by date retrieved successfully",
            date: parsedDate.format('YYYY-MM-DD'),
            count: formattedAttendance.length,
            attendance: formattedAttendance
        });

    } catch (error) {
        console.error('Error in filterAttendanceByDate:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


export const getTotalHoursForUser = async (req, res) => {
    const { userId } = req.params;

    try {
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const totalHours = await Attendance.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } }, // Fix: Use 'new'
            { $group: { _id: null, total: { $sum: "$total_hours" } } } // Sum total_hours
        ]);

        res.json({ totalHours: totalHours[0]?.total || 0 }); // Return total hours
    } catch (error) {
        console.error("Error calculating total hours:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
