import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/contacts — List user's authorised contacts
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contacts = await prisma.authorisedContact.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(contacts);
  } catch (error) {
    console.error('[Contacts/GET]', error);
    return res.status(500).json({ error: 'Failed to fetch authorised contacts' });
  }
});

// POST /api/contacts — Add a new authorised contact
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, position, permissions } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone number are required.' });
  }

  try {
    const contact = await prisma.authorisedContact.create({
      data: {
        userId: req.user!.id,
        name,
        email: email.trim().toLowerCase(),
        phone,
        position: position || 'Representative',
        permissions: permissions || 'Full',
      },
    });
    return res.status(201).json(contact);
  } catch (error) {
    console.error('[Contacts/POST]', error);
    return res.status(500).json({ error: 'Failed to create authorised contact' });
  }
});

// DELETE /api/contacts/:id — Delete an authorised contact
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.authorisedContact.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Authorised contact not found' });
    }
    await prisma.authorisedContact.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Authorised contact removed successfully' });
  } catch (error) {
    console.error('[Contacts/DELETE]', error);
    return res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
