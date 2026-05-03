import express from 'express';
import multer from 'multer';
import path from 'path';
import { Group, Profile, GroupMember, GroupGoal, ChatMessage, StudyResource } from '../models.js';

const router = express.Router();

// File upload setup for local folders since Supabase was removed
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// -------------------------------------------------------------
// MEMBERS AND BASIC GROUP DETAILS
// -------------------------------------------------------------

router.get('/:groupId/details', async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:groupId/details', async (req, res) => {
    try {
        const { name, description } = req.body;
        const group = await Group.findByIdAndUpdate(req.params.groupId, { name, description }, { new: true });
        res.json(group);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:groupId/members', async (req, res) => {
    try {
        const members = await GroupMember.find({ group_id: req.params.groupId }).populate('user_id');
        // Format to match old structure expecting profiles
        const formatted = members.map(m => ({
            id: m._id,
            group_id: m.group_id,
            user_id: m.user_id?.user_id || m.user_id?._id, // fallback
            profiles: m.user_id,
            role: 'Member'
        }));
        res.json(formatted);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:groupId/members/:userId', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user_id: req.params.userId });
        if(profile) {
            await GroupMember.deleteOne({ group_id: req.params.groupId, user_id: profile._id });
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:groupId/invite', async (req, res) => {
    try {
        const { usn } = req.body;
        const profile = await Profile.findOne({ usn });
        if (!profile) return res.status(404).json({ error: 'Student not found with this USN' });
        
        const exists = await GroupMember.findOne({ group_id: req.params.groupId, user_id: profile._id });
        if (exists) return res.status(400).json({ error: 'Student already in group' });

        await GroupMember.create({ group_id: req.params.groupId, user_id: profile._id });
        res.status(201).json({ success: true, profile });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// -------------------------------------------------------------
// CHAT MESSAGES
// -------------------------------------------------------------

router.get('/:groupId/messages', async (req, res) => {
    try {
        const messages = await ChatMessage.find({ group_id: req.params.groupId })
            .populate('user_id')
            .sort('created_at');
            
        const formatted = messages.map(m => ({
            id: m._id,
            group_id: m.group_id,
            sender_id: m.user_id?.user_id, // Match frontend expected ID logic
            content: m.content,
            message_type: 'text',
            file_url: null,
            created_at: m.created_at,
            profiles: m.user_id
        }));
        res.json(formatted);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:groupId/messages', async (req, res) => {
    try {
        const { sender_id, content, message_type = 'text', file_url = null } = req.body;
        const profile = await Profile.findOne({ user_id: sender_id });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        let msg = await ChatMessage.create({
            group_id: req.params.groupId,
            user_id: profile._id,
            content,
            message_type,
            file_url
        });
        
        const populatedMsg = await ChatMessage.findById(msg._id).populate('user_id');
        res.status(201).json({
            id: populatedMsg._id,
            group_id: populatedMsg.group_id,
            sender_id: sender_id,
            content: populatedMsg.content,
            message_type: message_type,
            file_url: file_url,
            created_at: populatedMsg.created_at,
            profiles: populatedMsg.user_id
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// -------------------------------------------------------------
// GOALS
// -------------------------------------------------------------

router.get('/:groupId/goals', async (req, res) => {
    try {
        const goals = await GroupGoal.find({ group_id: req.params.groupId }).sort('due_date');
        res.json(goals.map(g => ({ ...g._doc, id: g._id })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:groupId/goals', async (req, res) => {
    try {
        const { title, due_date, priority, created_by } = req.body;
        const profile = await Profile.findOne({ user_id: created_by });
        const goal = await GroupGoal.create({
            group_id: req.params.groupId,
            title, due_date, priority,
            created_by: profile?._id
        });
        res.status(201).json({ ...goal._doc, id: goal._id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:groupId/goals/:goalId', async (req, res) => {
    try {
        const { status } = req.body;
        const goal = await GroupGoal.findByIdAndUpdate(req.params.goalId, { status }, { new: true });
        res.json({ ...goal._doc, id: goal._id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// -------------------------------------------------------------
// RESOURCES (Files)
// -------------------------------------------------------------

router.get('/:groupId/resources', async (req, res) => {
    try {
        const resources = await StudyResource.find({ group_id: req.params.groupId })
            .populate('uploaded_by')
            .sort('-created_at');
            
        res.json(resources.map(r => ({
            id: r._id,
            title: r.title,
            file_url: r.file_url,
            file_type: r.file_type,
            profiles: r.uploaded_by,
            created_at: r.created_at
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Using local file storage
router.post('/:groupId/resources', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const { uploader_id } = req.body;
        const profile = await Profile.findOne({ user_id: uploader_id });
        
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(fileExt);
        const isPdf = fileExt === '.pdf';
        const fileType = isImage ? 'image' : (isPdf ? 'pdf' : 'file');
        
        // Serve locally via express static folder
        const file_url = `http://localhost:5000/uploads/${req.file.filename}`;

        const resource = await StudyResource.create({
            group_id: req.params.groupId,
            title: req.file.originalname,
            file_url,
            file_type: fileType,
            uploaded_by: profile?._id
        });
        res.status(201).json(resource);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// -------------------------------------------------------------
// REQUESTS (Mocked for now since not fully documented in schema)
// -------------------------------------------------------------
router.get('/:groupId/requests', async (req, res) => {
    res.json([]);
});

export default router;
