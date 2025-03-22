import express from 'express';
import dotenv from 'dotenv';
import authRoutes from '../backend/routes/authRoutes.js'

import { connectDB } from './db/connectDB.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("Intern Attendance Web App");
});

app.use('/api/auth', authRoutes)

app.listen(PORT, () => {
    connectDB();
    console.log('Server is running on port', PORT);
})