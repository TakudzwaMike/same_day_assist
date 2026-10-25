import { Router, Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { teamFinanceService } from '../services/teamFinanceService';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

// GET /api/team-finances/my-ledger — Get logged in team member's full confirmed financials
router.get(
  '/my-ledger',
  requireAuth,
  requireRoles('Contractor', 'Dispatcher', 'Administrator', 'Super Administrator'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const data = await teamFinanceService.getMemberFinancials(userId);
      return res.json(data);
    } catch (error: any) {
      console.error('[TeamFinances/MyLedger]', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve team member financials' });
    }
  }
);

// GET /api/team-finances/statement/:month — Get monthly statement for specific month
router.get(
  '/statement/:month',
  requireAuth,
  requireRoles('Contractor', 'Dispatcher', 'Administrator', 'Super Administrator'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const month = req.params.month;
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'Invalid month format. Expected YYYY-MM.' });
      }

      const statement = await teamFinanceService.getMonthlyStatement(userId, month);
      return res.json(statement);
    } catch (error: any) {
      console.error('[TeamFinances/Statement]', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve monthly statement' });
    }
  }
);

// POST /api/team-finances/acknowledge-penalty/:id — Acknowledge formal receipt of case finding
router.post(
  '/acknowledge-penalty/:id',
  requireAuth,
  requireRoles('Contractor', 'Dispatcher'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const penaltyId = req.params.id;
      const updated = await teamFinanceService.acknowledgePenalty(userId, penaltyId);

      await writeAuditLog({
        userId,
        userType: req.user!.role,
        action: 'Case Notice Acknowledged',
        details: `Team member acknowledged receipt of Case Finding ${updated.caseNumber}.`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ success: true, penalty: updated });
    } catch (error: any) {
      console.error('[TeamFinances/AcknowledgePenalty]', error);
      return res.status(400).json({ error: error.message || 'Failed to acknowledge penalty' });
    }
  }
);

// POST /api/team-finances/appeal-penalty/:id — Submit formal appeal against penalty
router.post(
  '/appeal-penalty/:id',
  requireAuth,
  requireRoles('Contractor', 'Dispatcher'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const penaltyId = req.params.id;
      const { appealNotes } = req.body;

      if (!appealNotes || typeof appealNotes !== 'string' || appealNotes.trim().length < 5) {
        return res.status(400).json({ error: 'Please provide clear explanation and evidence details for the appeal.' });
      }

      const updated = await teamFinanceService.appealPenalty(userId, penaltyId, appealNotes.trim());

      await writeAuditLog({
        userId,
        userType: req.user!.role,
        action: 'Case Finding Appealed',
        details: `Team member lodged appeal for Case ${updated.caseNumber}: "${appealNotes.slice(0, 100)}..."`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ success: true, message: 'Appeal submitted for administrative review', penalty: updated });
    } catch (error: any) {
      console.error('[TeamFinances/AppealPenalty]', error);
      return res.status(400).json({ error: error.message || 'Failed to submit appeal' });
    }
  }
);

// POST /api/team-finances/request-payout — Request withdrawal of confirmed available balance
router.post(
  '/request-payout',
  requireAuth,
  requireRoles('Contractor', 'Dispatcher'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const payout = await teamFinanceService.requestPayout(userId);

      await writeAuditLog({
        userId,
        userType: req.user!.role,
        action: 'Payout Requested',
        details: `Team member submitted withdrawal request of R${payout.amount.toFixed(2)} to ${payout.bankAccount} (Ref: ${payout.payoutRef}).`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        success: true,
        message: `Payout of R${payout.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} scheduled to ${payout.bankAccount}.`,
        payout,
      });
    } catch (error: any) {
      console.error('[TeamFinances/RequestPayout]', error);
      return res.status(400).json({ error: error.message || 'Failed to request payout' });
    }
  }
);

// GET /api/team-finances/member/:memberId — Admin only: view specific member ledger
router.get(
  '/member/:memberId',
  requireAuth,
  requireRoles('Administrator', 'Super Administrator'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const memberId = req.params.memberId;
      const data = await teamFinanceService.getMemberFinancials(memberId);
      return res.json(data);
    } catch (error: any) {
      console.error('[TeamFinances/AdminMemberView]', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve member financials' });
    }
  }
);

export default router;
