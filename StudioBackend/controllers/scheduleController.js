import { generateSchedule as genaiGenerate } from '../utils/genai.js';

export async function createSchedule(req, res) {
          const { shifts, staff } = req.body || {};

          if (!Array.isArray(shifts) || !Array.isArray(staff)) {
                    return res.status(400).json({ error: 'Request body must include `shifts` and `staff` arrays.' });
          }

          try {
                    const result = await genaiGenerate(shifts, staff);
                    return res.json(result);
          } catch (err) {
                    console.error('Schedule generation failed:', err);
                    return res.status(500).json({ error: err.message || 'Schedule generation failed' });
          }
}
