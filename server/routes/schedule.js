
import express from 'express';
import { StudySession, GroupMember, Group, Profile } from '../models.js';

const router = express.Router();

// 1. Fetch All Relevant Sessions (My Groups + Universal)
router.get('/', async (req, res) => {
    try {
        const sessions = await StudySession.find().populate('group_id').sort('start_time');
        
        // Match frontend expectation
        const formatted = sessions.map(s => ({
            id: s._id,
            title: s.title,
            group_id: s.group_id?._id,
            start_time: s.start_time,
            end_time: s.end_time,
            session_type: s.session_type,
            created_by: s.created_by,
            groups: s.group_id ? {
                id: s.group_id._id,
                name: s.group_id.name,
                type: s.group_id.type,
                subject_code: s.group_id.subject_code
            } : null
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Fetch User Memberships for Groups
router.get('/memberships/:userId', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user_id: req.params.userId });
        if (!profile) return res.json([]);
        
        const memberships = await GroupMember.find({ user_id: profile._id }).populate('group_id');
        const formatted = memberships
            .filter(m => m.group_id)
            .map(m => ({
                id: m.group_id._id,
                name: m.group_id.name,
                type: m.group_id.type,
                subject_code: m.group_id.subject_code
            }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Create a New Session
router.post('/', async (req, res) => {
    try {
        const { title, group_id, start_time, end_time, session_type, created_by } = req.body;
        const newSession = await StudySession.create({
            title,
            group_id: group_id || null,
            start_time,
            end_time,
            session_type,
            created_by
        });
        res.status(201).json(newSession);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
