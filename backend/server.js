import express from 'express';
import dotenv from 'dotenv';
import authRoutes from '../backend/routes/authRoutes.js'

import { connectDB } from './db/connectDB.js';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
    res.send("Intern Attendance Web App");
});

app.use('/api/auth', authRoutes)

app.listen(3000, () => {
    connectDB();
})