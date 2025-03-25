import express from "express";

import { 
    getUserAttendance, 
    timeIn, 
    timeOut,
    updateTimeIn,
    updateTimeOut,
    approveAttendance,
    rejectAttendance,
    getAllAttendance
} from "../controllers/attendanceControllers.js";

const router = express.Router();

router.get('/get-attendance/:userId', getUserAttendance);
router.get('/get-all-attendance', getAllAttendance);
router.post('/time-in', timeIn);
router.post('/time-out', timeOut);
router.patch('/update-time-in/:userId', updateTimeIn); 
router.patch('/update-time-out/:userId', updateTimeOut);
router.post('/approve-attendance/:userId', approveAttendance);
router.post('/reject-attendance/:userId', rejectAttendance);

export default router; 