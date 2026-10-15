import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper to get fallback familyId
async function getTargetFamilyId(req: AuthenticatedRequest): Promise<string> {
  if (req.user?.familyId) {
    return req.user.familyId;
  }
  const defaultFamily = await prisma.family.findFirst();
  return defaultFamily?.id || '';
}

// Get Memory Orbs for Family
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const familyId = await getTargetFamilyId(req);
    const { emotion, elderId } = req.query;

    const whereClause: any = { familyId };
    if (emotion && typeof emotion === 'string') {
      whereClause.emotion = emotion;
    }
    if (elderId && typeof elderId === 'string') {
      whereClause.OR = [{ targetElderId: elderId }, { targetElderId: null }];
    }

    const orbs = await prisma.memoryOrb.findMany({
      where: whereClause,
      include: {
        options: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ orbs });
  } catch (error) {
    console.error('Get orbs error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory orbs' });
  }
});

// Create New Memory Orb
router.post('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const familyId = await getTargetFamilyId(req);
    const {
      emotion = 'joy',
      title,
      titleEn,
      description,
      descriptionEn,
      memoryYear = 'พ.ศ. 2567',
      memoryYearEn = '2024',
      photoUrl,
      videoUrl,
      voicePrompt,
      voicePromptEn,
      voiceSuccess,
      voiceSuccessEn,
      gentleClue,
      gentleClueEn,
      correctAnswer,
      correctAnswerEn,
      glowColor,
      accentBg,
      targetElderId,
      options = [],
    } = req.body;

    if (!title || !photoUrl || !voicePrompt || !correctAnswer) {
      res.status(400).json({
        error: 'title, photoUrl, voicePrompt, and correctAnswer are required',
      });
      return;
    }

    // Default glow color and accent backgrounds based on emotion
    const emotionStyles: Record<string, { glow: string; bg: string }> = {
      joy: {
        glow: 'rgba(245, 158, 11, 0.45)',
        bg: 'from-amber-400 via-amber-300 to-yellow-200',
      },
      nostalgia: {
        glow: 'rgba(2, 132, 199, 0.45)',
        bg: 'from-sky-400 via-sky-300 to-blue-200',
      },
      love: {
        glow: 'rgba(225, 29, 72, 0.45)',
        bg: 'from-rose-400 via-rose-300 to-pink-200',
      },
      vitality: {
        glow: 'rgba(16, 185, 129, 0.45)',
        bg: 'from-emerald-400 via-emerald-300 to-teal-200',
      },
      celebration: {
        glow: 'rgba(139, 92, 246, 0.45)',
        bg: 'from-violet-400 via-violet-300 to-purple-200',
      },
    };

    const style = emotionStyles[emotion] || emotionStyles.joy;

    const orb = await prisma.memoryOrb.create({
      data: {
        familyId,
        targetElderId: targetElderId || null,
        emotion,
        title,
        titleEn,
        description,
        descriptionEn,
        memoryYear,
        memoryYearEn,
        photoUrl,
        videoUrl,
        voicePrompt,
        voicePromptEn,
        voiceSuccess: voiceSuccess || 'เก่งมากเลยค่ะ! ถูกต้องแล้วค่ะ!',
        voiceSuccessEn: voiceSuccessEn || 'Wonderful! You got it right!',
        gentleClue: gentleClue || 'ค่อยๆ นึกนะคะ คุณยายจำได้แน่นอนค่ะ',
        gentleClueEn: gentleClueEn || 'Take your time, you surely remember this wonderful moment!',
        correctAnswer,
        correctAnswerEn,
        glowColor: glowColor || style.glow,
        accentBg: accentBg || style.bg,
        isUnlocked: false,
        uploadedBy: req.user?.name ? `${req.user.name} (ลูกหลาน)` : 'ลูกหลานในครอบครัว',
        uploadedByEn: req.user?.name || 'Family member',
        uploadDate: 'วันนี้',
        uploadDateEn: 'Today',
        options: {
          create: options.map((opt: any) => ({
            label: opt.label,
            labelEn: opt.labelEn,
            relation: opt.relation,
            relationEn: opt.relationEn,
            photoUrl: opt.photoUrl || photoUrl,
            isCorrect: Boolean(opt.isCorrect),
          })),
        },
      },
      include: {
        options: true,
      },
    });

    res.status(201).json({
      message: 'Memory Orb created successfully',
      orb,
    });
  } catch (error) {
    console.error('Create orb error:', error);
    res.status(500).json({ error: 'Failed to create memory orb' });
  }
});

// Unlock Memory Orb
router.patch('/:id/unlock', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const orb = await prisma.memoryOrb.update({
      where: { id },
      data: { isUnlocked: true },
      include: { options: true },
    });

    res.json({
      message: 'Memory Orb unlocked!',
      orb,
    });
  } catch (error) {
    console.error('Unlock orb error:', error);
    res.status(500).json({ error: 'Failed to unlock memory orb' });
  }
});

// Delete Memory Orb
router.delete('/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await prisma.memoryOrb.delete({
      where: { id },
    });

    res.json({ message: 'Memory Orb deleted successfully' });
  } catch (error) {
    console.error('Delete orb error:', error);
    res.status(500).json({ error: 'Failed to delete memory orb' });
  }
});

export default router;
