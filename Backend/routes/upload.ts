import { Router, Request, Response } from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import { verifyToken, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import path from 'path';

export const uploadRouter = Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

// POST /api/upload/image
// Returns: { url: string }
uploadRouter.post(
  '/image',
  verifyToken,
  upload.single('image'),
  async (req: AuthRequest & Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connStr) {
      return res.status(500).json({ error: 'Azure Storage not configured' });
    }

    try {
      const containerName = process.env.AZURE_STORAGE_CONTAINER || 'citizen-shield-images';
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const blobName = `posts/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

      const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype },
      });

      return res.json({ url: blockBlobClient.url });
    } catch (err) {
      console.error('POST /upload/image error', err);
      return res.status(500).json({ error: 'Upload failed' });
    }
  }
);
