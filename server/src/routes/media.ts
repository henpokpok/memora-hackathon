import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadPhoto, uploadVideo, uploadAnyMedia } from '../middleware/upload';
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

// Upload Family Photo
router.post(
  '/upload-photo',
  optionalAuthenticateToken,
  uploadPhoto.single('photo'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No photo file provided' });
        return;
      }

      const familyId = await getTargetFamilyId(req);
      const relativeUrl = `/uploads/photos/${req.file.filename}`;

      const media = await prisma.mediaUpload.create({
        data: {
          familyId,
          uploaderId: req.user?.id || null,
          mediaType: 'image',
          originalFilename: req.file.originalname,
          storedFilename: req.file.filename,
          filePath: req.file.path,
          fileUrl: relativeUrl,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
        },
      });

      res.status(201).json({
        message: 'Photo uploaded successfully',
        media,
        url: relativeUrl,
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  }
);

// Upload Family Video
router.post(
  '/upload-video',
  optionalAuthenticateToken,
  uploadVideo.single('video'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No video file provided' });
        return;
      }

      const familyId = await getTargetFamilyId(req);
      const relativeUrl = `/uploads/videos/${req.file.filename}`;

      const media = await prisma.mediaUpload.create({
        data: {
          familyId,
          uploaderId: req.user?.id || null,
          mediaType: 'video',
          originalFilename: req.file.originalname,
          storedFilename: req.file.filename,
          filePath: req.file.path,
          fileUrl: relativeUrl,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
        },
      });

      res.status(201).json({
        message: 'Video uploaded successfully',
        media,
        url: relativeUrl,
      });
    } catch (error) {
      console.error('Upload video error:', error);
      res.status(500).json({ error: 'Failed to upload video' });
    }
  }
);

// List all uploaded media for family
router.get('/list', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const familyId = await getTargetFamilyId(req);
    const mediaType = req.query.type as string | undefined;

    const whereClause: any = { familyId };
    if (mediaType) {
      whereClause.mediaType = mediaType;
    }

    const items = await prisma.mediaUpload.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { name: true, role: true },
        },
      },
    });

    res.json({ media: items });
  } catch (error) {
    console.error('List media error:', error);
    res.status(500).json({ error: 'Failed to retrieve media list' });
  }
});

// Delete media item
router.delete('/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const media = await prisma.mediaUpload.findUnique({
      where: { id },
    });

    if (!media) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    // Try deleting physical file from disk
    const fs = await import('fs');
    if (fs.existsSync(media.filePath)) {
      try {
        fs.unlinkSync(media.filePath);
      } catch (err) {
        console.warn('Could not delete physical file:', err);
      }
    }

    await prisma.mediaUpload.delete({
      where: { id },
    });

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
