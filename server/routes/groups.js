import express from 'express';
import { Group, Profile, GroupMember } from '../models.js';

const router = express.Router();

// 1. Fetch All Groups (Universal or Private)
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};
        if (type) query.type = type;

        const groups = await Group.find(query).populate('admin_id');
        
        // Format to match old Supabase expectations temporarily to prevent UI breaking
        const formatted = groups.map(g => ({
            id: g._id,
            name: g.name,
            subject_code: g.subject_code,
            description: g.description,
            type: g.type,
            creator_id: g.admin_id?._id,
            profiles: g.admin_id || null
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching groups' });
    }
});

// 2. Fetch User Memberships
router.get('/memberships/:userId', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user_id: req.params.userId });
        if (!profile) return res.json([]);
        const memberships = await GroupMember.find({ user_id: profile._id });
        res.json(memberships);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Join a Group
router.post('/join', async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const profile = await Profile.findOne({ user_id: userId });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        
        const exists = await GroupMember.findOne({ group_id: groupId, user_id: profile._id });
        if (!exists) {
            await GroupMember.create({ group_id: groupId, user_id: profile._id });
        }
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error joining group' });
    }
});

// 4. Request Private Group
router.post('/request', async (req, res) => {
    try {
        // Here we would insert into grouprequests if you need it later.
        // For now, let's just approve immediately or log it.
        res.status(200).json({ success: true, message: "Request processing" });
    } catch (err) {
        res.status(500).json({ error: 'Server error requesting' });
    }
});

// 5. Create a new Group
router.post('/', async (req, res) => {
    try {
        const { name, description, type, creator_id, mother_tongue, subject_code } = req.body;
        const profile = await Profile.findOne({ user_id: creator_id });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        
        // Create the group mapped to Mongoose Schema
        const newGroup = await Group.create({
            name,
            description,
            type,
            mother_tongue,
            subject_code,
            admin_id: profile._id
        });
        
        // Auto-add the creator to the group members
        await GroupMember.create({
            group_id: newGroup._id,
            user_id: profile._id,
        });

        res.status(201).json(newGroup);
    } catch (err) {
        console.error('Create error:', err);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

export default router;
