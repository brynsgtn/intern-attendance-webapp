import express from "express";

import { getUserAttendance, timeIn, timeOut } from "../controllers/attendanceControllers.js";

const router = express.Router();


router.post('/time-in', timeIn);
router.post('/time-out', timeOut);
router.get('/get-attendance/:userId', getUserAttendance);

export default router; 