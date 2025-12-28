import express from 'express';
import { createSchedule } from '../controllers/scheduleController.js';

const router = express.Router();

router.post('/', createSchedule);

export default router;
