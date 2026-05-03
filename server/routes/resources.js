
import express from 'express';
import { StudyResource } from '../models.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Setup Multer for General Resources
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 1. Fetch Resources with filters
router.get('/', async (req, res) => {
    try {
        const { subject_code, branch, semester } = req.query;
        let query = {};
        if (subject_code) query.subject_code = subject_code;
        if (branch) query.branch = branch;
        if (semester) query.semester = semester;

        const resources = await StudyResource.find(query).sort({ created_at: -1 });
        
        // Map to frontend expectation
        const formatted = resources.map(r => ({
            id: r._id,
            title: r.title,
            file_path: r.file_url, // We use file_url as the path
            file_type: r.file_type,
            file_size: r.file_size || 0,
            created_at: r.created_at,
            uploaded_by: r.uploaded_by
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Upload a Resource
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { title, subject_code, subject_name, branch, semester, uploaded_by } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const newResource = await StudyResource.create({
            title: title || file.originalname,
            subject_code,
            subject_name,
            branch,
            semester,
            file_url: `/uploads/${file.filename}`,
            file_type: file.mimetype.split('/')[1],
            file_size: file.size,
            uploaded_by
        });

        res.status(201).json(newResource);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete a Resource
router.delete('/:id', async (req, res) => {
    try {
        await StudyResource.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
