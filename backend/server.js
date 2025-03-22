import express from 'express';
import dotenv from 'dotenv';

import { connectDB } from './db/connectDB.js';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
    res.send("Intern Attendance Web App");
});


app.listen(3000, () => {
    connectDB();
})