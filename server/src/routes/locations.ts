import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/locations — List user's saved locations
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const locations = await prisma.savedLocation.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(locations);
  } catch (error) {
    console.error('[Locations/GET]', error);
    return res.status(500).json({ error: 'Failed to fetch saved locations' });
  }
});

// POST /api/locations — Add a new saved location
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { label, address, lat, lng, accessNotes } = req.body;
  if (!label || !address || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Label, address, latitude, and longitude are required.' });
  }

  try {
    const location = await prisma.savedLocation.create({
      data: {
        userId: req.user!.id,
        label,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        accessNotes: accessNotes || null,
      },
    });
    return res.status(201).json(location);
  } catch (error) {
    console.error('[Locations/POST]', error);
    return res.status(500).json({ error: 'Failed to create saved location' });
  }
});

// DELETE /api/locations/:id — Delete a saved location
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.savedLocation.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Saved location not found' });
    }
    await prisma.savedLocation.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Saved location deleted successfully' });
  } catch (error) {
    console.error('[Locations/DELETE]', error);
    return res.status(500).json({ error: 'Failed to delete saved location' });
  }
});

export default router;
