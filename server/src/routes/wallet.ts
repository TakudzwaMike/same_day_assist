import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

// GET /api/wallet/balance — Fetch current user's digital wallet & transaction history
router.get('/balance', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Auto-create wallet if missing
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: req.user!.id,
          balance: 2500.0, // Default ZAR 2,500 complimentary signup credit balance
          currency: 'ZAR',
          transactions: {
            create: {
              amount: 2500.0,
              type: 'Bonus Reward',
              description: 'Complimentary Same Day Assist Welcome Wallet Balance',
            },
          },
        },
        include: {
          transactions: { orderBy: { createdAt: 'desc' } },
        },
      });
    }

    return res.json(wallet);
  } catch (error) {
    console.error('[Wallet/Balance]', error);
    return res.status(500).json({ error: 'Failed to fetch wallet details' });
  }
});

// POST /api/wallet/top-up — Top up digital wallet funds
router.post('/top-up', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { amount, description } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid positive top-up amount required' });
  }

  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: req.user!.id, balance: 0.0, currency: 'ZAR' },
      });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: numAmount },
        transactions: {
          create: {
            amount: numAmount,
            type: 'TopUp',
            description: description || 'Digital Wallet Credit Top-Up via Card/EFT',
          },
        },
      },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Wallet Top-Up',
      details: `User topped up wallet by ZAR ${numAmount}. New Balance: ZAR ${updatedWallet.balance}`,
    });

    return res.json({ success: true, wallet: updatedWallet });
  } catch (error) {
    console.error('[Wallet/TopUp]', error);
    return res.status(500).json({ error: 'Failed to top up wallet' });
  }
});

export default router;
