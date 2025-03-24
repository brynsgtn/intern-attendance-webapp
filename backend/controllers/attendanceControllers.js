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
            return res.status(400).json({ message: "Invalid user ID" });
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
            return res.status(400).json({ message: "Invalid user ID" });
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
        return res.status(400).json({ message: "Invalid user ID" });
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
          
          if (totalHours >= 4) {
            totalHours = totalHours - 1; // Deduct 1 hour for lunch break
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
