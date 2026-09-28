import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

// GET /api/vehicles — List user's saved vehicles (or all if admin)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isAdmin = req.user!.role === 'Administrator' || req.user!.role === 'Super Administrator';
    const vehicles = await prisma.vehicle.findMany({
      where: isAdmin ? {} : { userId: req.user!.id },
      include: isAdmin ? { user: { select: { id: true, name: true, email: true, phone: true } } } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return res.json(vehicles);
  } catch (error) {
    console.error('[Vehicles/GET]', error);
    return res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// POST /api/vehicles — Register a new vehicle
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { make, model, year, licensePlate, color, vinNumber, notes } = req.body;
  if (!make || !model || !licensePlate) {
    return res.status(400).json({ error: 'Vehicle make, model, and license plate are required.' });
  }

  const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();
  if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 2) {
    return res.status(400).json({ error: 'Please provide a valid manufacturing year.' });
  }

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user!.id,
        make: make.trim(),
        model: model.trim(),
        year: parsedYear,
        licensePlate: licensePlate.trim().toUpperCase(),
        color: (color || 'Unspecified').trim(),
        vinNumber: vinNumber ? vinNumber.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Vehicle Registered',
      details: `Registered vehicle ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      newValue: { vehicleId: vehicle.id, licensePlate: vehicle.licensePlate },
    });

    return res.status(201).json(vehicle);
  } catch (error) {
    console.error('[Vehicles/POST]', error);
    return res.status(500).json({ error: 'Failed to register vehicle' });
  }
});

// PUT /api/vehicles/:id — Update vehicle details
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { make, model, year, licensePlate, color, vinNumber, notes } = req.body;

  try {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle record not found' });
    }

    const isAdmin = req.user!.role === 'Administrator' || req.user!.role === 'Super Administrator';
    if (!isAdmin && existing.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this vehicle' });
    }

    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        make: make ? make.trim() : existing.make,
        model: model ? model.trim() : existing.model,
        year: year ? parseInt(year, 10) : existing.year,
        licensePlate: licensePlate ? licensePlate.trim().toUpperCase() : existing.licensePlate,
        color: color ? color.trim() : existing.color,
        vinNumber: vinNumber !== undefined ? (vinNumber ? vinNumber.trim() : null) : existing.vinNumber,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('[Vehicles/PUT]', error);
    return res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /api/vehicles/:id — Remove a vehicle
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const isAdmin = req.user!.role === 'Administrator' || req.user!.role === 'Super Administrator';
    if (!isAdmin && existing.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this vehicle' });
    }

    await prisma.vehicle.delete({ where: { id: req.params.id } });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Vehicle Removed',
      details: `Removed vehicle ${existing.make} ${existing.model} (${existing.licensePlate})`,
      previousValue: { vehicleId: existing.id, licensePlate: existing.licensePlate },
    });

    return res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('[Vehicles/DELETE]', error);
    return res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

export default router;
