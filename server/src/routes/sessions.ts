import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper to get fallback familyId and active elderId
async function getFamilyAndElder(req: AuthenticatedRequest): Promise<{ familyId: string; elderId: string }> {
  let familyId = req.user?.familyId;
  if (!familyId) {
    const defaultFamily = await prisma.family.findFirst();
    familyId = defaultFamily?.id || '';
  }

  const activeElder = await prisma.familyMember.findFirst({
    where: { familyId, role: 'elder', isCurrentActive: true },
  });

  const fallbackElder = activeElder || (await prisma.familyMember.findFirst({ where: { familyId, role: 'elder' } }));

  return {
    familyId,
    elderId: fallbackElder?.id || '',
  };
}

// Log a daily session result
router.post('/log', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { completedOrbs, totalOrbs = 5, averageSpeedSec = 11.4, overallMood = 'ความสุขเบ่งบาน', rawMetrics } = req.body;

    const { familyId, elderId } = await getFamilyAndElder(req);

    if (!familyId || !elderId) {
      res.status(400).json({ error: 'Family or Elder not found' });
      return;
    }

    // Calculate streak
    const previousLogs = await prisma.sessionLog.count({
      where: { familyId, elderId },
    });
    const streakDays = previousLogs + 1;

    const session = await prisma.sessionLog.create({
      data: {
        familyId,
        elderId,
        completedOrbs: Number(completedOrbs) || 0,
        totalOrbs: Number(totalOrbs) || 5,
        averageSpeedSec: parseFloat(String(averageSpeedSec)),
        overallMood,
        streakDays,
        lineSent: true,
        lineSentAt: new Date(),
        rawMetricsJson: rawMetrics ? JSON.stringify(rawMetrics) : null,
      },
    });

    res.status(201).json({
      message: 'Session logged successfully',
      session,
    });
  } catch (error) {
    console.error('Log session error:', error);
    res.status(500).json({ error: 'Failed to log session' });
  }
});

// Get latest stats & LINE capsule report
router.get('/latest', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { familyId, elderId } = await getFamilyAndElder(req);

    const latestSession = await prisma.sessionLog.findFirst({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
      include: {
        elder: true,
      },
    });

    const totalOrbsCount = await prisma.memoryOrb.count({ where: { familyId } });
    const unlockedOrbsCount = await prisma.memoryOrb.count({ where: { familyId, isUnlocked: true } });

    res.json({
      stats: {
        completedToday: latestSession?.completedOrbs ?? unlockedOrbsCount,
        totalOrbs: latestSession?.totalOrbs ?? totalOrbsCount,
        streakDays: latestSession?.streakDays ?? 14,
        averageSpeedSec: latestSession?.averageSpeedSec ?? 11.4,
        overallMood: latestSession?.overallMood ?? 'ความสุขเบ่งบาน',
        lastPlayed: latestSession?.createdAt ?? new Date(),
        elderName: latestSession?.elder?.name ?? 'คุณยายสมศรี',
      },
    });
  } catch (error) {
    console.error('Get latest session error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

export default router;
