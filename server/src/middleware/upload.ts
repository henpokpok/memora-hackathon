import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const uploadsDir = path.resolve(__dirname, '../../uploads');
const photosDir = path.join(uploadsDir, 'photos');
const videosDir = path.join(uploadsDir, 'videos');

// Ensure upload directories exist
[uploadsDir, photosDir, videosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, videosDir);
    } else {
      cb(null, photosDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File Filters
const imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg', 'image/gif'];
const videoMimes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];

export const uploadPhoto = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (imageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Allowed: JPG, PNG, WEBP, HEIC.'));
    }
  },
});

export const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (videoMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Allowed: MP4, MOV, WEBM.'));
    }
  },
});

export const uploadAnyMedia = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (imageMimes.includes(file.mimetype) || videoMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported media format.'));
    }
  },
});
