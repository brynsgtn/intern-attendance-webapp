import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from '../backend/routes/authRoutes.js'
import attendanceRoutes from '../backend/routes/attendanceRoutes.js'

import { connectDB } from './db/connectDB.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // allows to parse incoming requests: req.body
app.use(cookieParser()); // allows us to parse incoming cookies
app.use(express.static('public'));

// Serve static images
app.use('/public/images', express.static('public/images'));

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

app.listen(PORT, () => {
    connectDB();
    console.log('Server is running on port', PORT);
})