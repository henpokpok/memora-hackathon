import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuthenticateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get Current Family (with active members)
router.get('/current', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let familyId = req.user?.familyId;

    let family = null;
    if (familyId) {
      family = await prisma.family.findUnique({
        where: { id: familyId },
        include: {
          members: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    // Fallback: If no family found or unauthenticated, return the first seeded family (Demo experience)
    if (!family) {
      family = await prisma.family.findFirst({
        include: {
          members: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    if (!family) {
      res.status(404).json({ error: 'No family group found' });
      return;
    }

    res.json({ family });
  } catch (error) {
    console.error('Get current family error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join Family by familyCode
router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { familyCode } = req.body;
    if (!familyCode) {
      res.status(400).json({ error: 'Family code is required' });
      return;
    }

    const family = await prisma.family.findUnique({
      where: { familyCode: familyCode.toUpperCase().trim() },
    });

    if (!family) {
      res.status(404).json({ error: 'Family code not found' });
      return;
    }

    // Update user's familyId
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { familyId: family.id },
    });

    // Update or link family member
    const existingMember = await prisma.familyMember.findUnique({
      where: { userId: req.user!.id },
    });

    if (existingMember) {
      await prisma.familyMember.update({
        where: { id: existingMember.id },
        data: { familyId: family.id },
      });
    } else {
      await prisma.familyMember.create({
        data: {
          familyId: family.id,
          userId: req.user!.id,
          name: req.user!.name,
          role: req.user!.role,
          relationTitle: req.user!.role === 'elder' ? 'คุณยาย' : 'ลูกหลาน',
          avatarIcon: req.user!.role === 'elder' ? 'heart' : 'user',
          avatarColor: 'bg-indigo-500 text-white',
        },
      });
    }

    res.json({
      message: 'Successfully joined family',
      family,
    });
  } catch (error) {
    console.error('Join family error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add Family Member (e.g. from Child Portal)
router.post('/member', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      role = 'relative',
      relationTitle,
      avatarIcon = 'heart',
      avatarColor = 'bg-rose-500 text-white',
      birthYear,
      notes,
    } = req.body;

    if (!name || !relationTitle) {
      res.status(400).json({ error: 'Name and relationTitle are required' });
      return;
    }

    let familyId = req.user?.familyId;
    if (!familyId) {
      const defaultFamily = await prisma.family.findFirst();
      if (!defaultFamily) {
        res.status(404).json({ error: 'No family group available' });
        return;
      }
      familyId = defaultFamily.id;
    }

    const member = await prisma.familyMember.create({
      data: {
        familyId,
        name,
        role: role === 'elder' ? 'elder' : 'relative',
        relationTitle,
        avatarIcon,
        avatarColor,
        birthYear: birthYear ? parseInt(birthYear, 10) : null,
        notes,
        isCurrentActive: false,
      },
    });

    res.status(201).json({
      message: 'Member added successfully',
      member,
    });
  } catch (error) {
    console.error('Add family member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Switch active senior for training sessions
router.patch('/member/:id/active', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const targetMember = await prisma.familyMember.findUnique({
      where: { id },
    });

    if (!targetMember) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    // Set all elders in this family to isCurrentActive: false
    await prisma.familyMember.updateMany({
      where: {
        familyId: targetMember.familyId,
        role: 'elder',
      },
      data: {
        isCurrentActive: false,
      },
    });

    // Set this elder to active
    const updated = await prisma.familyMember.update({
      where: { id },
      data: {
        isCurrentActive: true,
      },
    });

    res.json({
      message: 'Active senior switched successfully',
      activeMember: updated,
    });
  } catch (error) {
    console.error('Switch active senior error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Member (Change name, role, relationTitle, etc.)
router.patch('/member/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, role, relationTitle, avatarIcon, avatarColor, birthYear, notes } = req.body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (role !== undefined) dataToUpdate.role = role;
    if (relationTitle !== undefined) dataToUpdate.relationTitle = relationTitle;
    if (avatarIcon !== undefined) dataToUpdate.avatarIcon = avatarIcon;
    if (avatarColor !== undefined) dataToUpdate.avatarColor = avatarColor;
    if (birthYear !== undefined) dataToUpdate.birthYear = birthYear ? parseInt(birthYear, 10) : null;
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.familyMember.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      message: 'Member updated successfully',
      member: updated,
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Delete Member
router.delete('/member/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await prisma.familyMember.delete({
      where: { id },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

export default router;
