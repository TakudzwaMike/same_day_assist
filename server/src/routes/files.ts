import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import { saveFile } from '../services/storage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime',
  'application/pdf',
];

// POST /api/files/upload — Upload a file and record metadata
router.post('/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `File type ${req.file.mimetype} not permitted` });
    }

    const { jobId, assessmentId, quotationId, customerId } = req.body;

    const savedUrl = await saveFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    const record = await prisma.fileRecord.create({
      data: {
        filename: savedUrl.split('/').pop() || req.file.originalname,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size,
        url: savedUrl,
        uploadedById: req.user!.id,
        customerId: customerId || null,
        jobId: jobId || null,
        assessmentId: assessmentId || null,
        quotationId: quotationId || null,
      },
    });

    return res.status(201).json(record);
  } catch (error) {
    console.error('[Files/Upload]', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /api/files/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await prisma.fileRecord.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ error: 'File not found' });
    return res.json(record);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

export default router;
