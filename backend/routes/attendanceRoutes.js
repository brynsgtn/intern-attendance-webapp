import express from "express";

import { 
    getUserAttendance, 
    timeIn, 
    timeOut,
    updateTimeIn,
    updateTimeOut,
    approveAttendance,
    rejectAttendance,
    getAllAttendance,
    getUserRemainingHours,
    getAllTeamMembersAttendance,
    filterAttendanceByName
} from "../controllers/attendanceControllers.js";
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/get-attendance/:userId', getUserAttendance);
router.get('/get-all-attendance', getAllAttendance);
router.post('/time-in', timeIn);
router.post('/time-out', timeOut);
router.patch('/update-time-in/:userId', updateTimeIn); 
router.patch('/update-time-out/:userId', updateTimeOut);
router.post('/approve-attendance/:userId', approveAttendance);
router.post('/reject-attendance/:userId', rejectAttendance);
router.get('/team-attendance', verifyToken, getAllTeamMembersAttendance);
router.get('/members-total-hours', verifyToken, getUserRemainingHours);
router.get('/filter-by-name',verifyToken, filterAttendanceByName);

export default router; 