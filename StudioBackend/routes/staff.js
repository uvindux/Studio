import express from 'express';
import Staff from '../models/Staff.js';

const router = express.Router();

// GET /api/staff - list all staff
router.get('/', async (_req, res) => {
          try {
                    const docs = await Staff.find().sort({ createdAt: 1 }).lean();
                    // Map _id to id to match frontend expectations
                    const results = docs.map(d => ({ id: d._id.toString(), name: d.name, role: d.role, constraints: d.constraints, avatar: d.avatar }));
                    res.json(results);
          } catch (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Failed to fetch staff' });
          }
});

// POST /api/staff - create staff
router.post('/', async (req, res) => {
          try {
                    const { name, role, constraints, avatar } = req.body;
                    if (!name || !role) return res.status(400).json({ error: 'name and role required' });

                    const doc = await Staff.create({ name, role, constraints, avatar });
                    res.status(201).json({ id: doc._id.toString(), name: doc.name, role: doc.role, constraints: doc.constraints, avatar: doc.avatar });
          } catch (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Failed to create staff' });
          }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
          try {
                    const { id } = req.params;
                    await Staff.findByIdAndDelete(id);
                    res.json({ ok: true });
          } catch (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Failed to delete' });
          }
});

export default router;
