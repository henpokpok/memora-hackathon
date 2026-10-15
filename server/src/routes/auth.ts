import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper to generate readable Family Code: e.g. MEMORA-5928
function generateFamilyCode(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `MEMORA-${randomDigits}`;
}

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'relative', familyCode, familyName, relationTitle } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let family;
    if (familyCode) {
      // Find existing family by code
      family = await prisma.family.findUnique({
        where: { familyCode: familyCode.toUpperCase().trim() },
      });
      if (!family) {
        res.status(404).json({ error: 'Invalid family code' });
        return;
      }
    } else {
      // Create a new family group
      let code = generateFamilyCode();
      // Ensure unique code
      while (await prisma.family.findUnique({ where: { familyCode: code } })) {
        code = generateFamilyCode();
      }

      family = await prisma.family.create({
        data: {
          familyName: familyName || `ครอบครัวของคุณ${name}`,
          familyCode: code,
        },
      });
    }

    // Create User
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role === 'elder' ? 'elder' : 'relative',
        familyId: family.id,
      },
    });

    // Create FamilyMember entry
    const isFirstElder = role === 'elder';
    const member = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId: user.id,
        name,
        role: role === 'elder' ? 'elder' : 'relative',
        relationTitle: relationTitle || (role === 'elder' ? 'คุณยาย' : 'ลูกหลาน'),
        avatarIcon: role === 'elder' ? 'heart' : 'user',
        avatarColor: role === 'elder' ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white',
        isCurrentActive: isFirstElder,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      familyId: family.id,
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: family.id,
      },
      family: {
        id: family.id,
        familyName: family.familyName,
        familyCode: family.familyCode,
      },
      member,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        family: true,
        familyMember: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      familyId: user.familyId,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        familyId: user.familyId,
      },
      family: user.family,
      member: user.familyMember,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Profile (Me)
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        familyId: true,
        family: {
          include: {
            members: true,
          },
        },
        familyMember: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Profile
router.patch('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, avatarUrl } = req.body;
    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        familyId: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
