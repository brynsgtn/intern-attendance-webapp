import express from "express";

import { 
    getUserAttendance, 
    timeIn, 
    timeOut,
    approveAttendance,
    rejectAttendance,
    getAllAttendance,
    getMemberRemainingHours,
    getAllTeamMembersAttendance,
    filterAttendanceByName,
    viewAllEditRequests,
    filterAttendanceByDate,
    getTotalHoursForUser,
    updateAttendance,
    deleteAttendanceRecord
} from "../controllers/attendanceControllers.js";
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/get-attendance/:userId', getUserAttendance);
router.get('/get-all-attendance', verifyToken, getAllAttendance);
router.post('/time-in/:userId', timeIn);
router.post('/time-out/:userId', timeOut);
router.post('/update-attendance/:userId', updateAttendance); 
router.post('/approve-attendance/:userId', verifyToken, approveAttendance);
router.post('/reject-attendance/:userId', verifyToken, rejectAttendance);
router.get('/team-attendance', verifyToken, getAllTeamMembersAttendance);
router.get('/member-remaining-hours/:memberId', verifyToken, getMemberRemainingHours);
router.get('/filter-by-name',verifyToken, filterAttendanceByName);
router.get('/edit-requests', verifyToken, viewAllEditRequests);
router.get('/filter-by-date', verifyToken, filterAttendanceByDate);
router.get('/get-total-hours/:userId', verifyToken, getTotalHoursForUser);
router.delete('/delete-attendance/:attendanceId', verifyToken, deleteAttendanceRecord);

export default router; 
