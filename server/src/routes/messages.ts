import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/messages/job/:jobId — Fetch chat message history for a job
router.get('/job/:jobId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { jobId: req.params.jobId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const parsed = messages.map(m => ({
      ...m,
      senderName: m.sender.name,
    }));

    return res.json(parsed);
  } catch (error) {
    console.error('[Messages/GET]', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messages/job/:jobId — Send direct chat message on a job
router.post('/job/:jobId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { text, attachmentUrl, recipientId } = req.body;
  if (!text && !attachmentUrl) {
    return res.status(400).json({ error: 'Message text or attachment required' });
  }

  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Target recipient: if sender is Customer -> recipient is Contractor (or vice versa)
    const targetRecipientId = recipientId || (req.user!.id === job.customerId ? job.assignedContractorId : job.customerId);
    if (!targetRecipientId) {
      return res.status(400).json({ error: 'Recipient cannot be determined' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        jobId: job.id,
        senderId: req.user!.id,
        recipientId: targetRecipientId,
        senderRole: req.user!.role,
        text: text || '',
        attachmentUrl: attachmentUrl || null,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Broadcast via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      const payload = {
        ...message,
        senderName: message.sender.name,
      };
      io.to(`customer-${job.customerId}`).emit('new-chat-message', payload);
      if (job.assignedContractorId) {
        io.to(`contractor-${job.assignedContractorId}`).emit('new-chat-message', payload);
      }
      io.to('admin-room').emit('new-chat-message', payload);
    }

    return res.json({
      ...message,
      senderName: message.sender.name,
    });
  } catch (error) {
    console.error('[Messages/POST]', error);
    return res.status(500).json({ error: 'Failed to send chat message' });
  }
});

export default router;
