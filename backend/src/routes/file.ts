import { Router, Request, Response } from 'express';
import { getUploadDir } from '../lib/upload';
import { getDb } from '../lib/mongodb';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET /api/file/* - Serve files (cover images only, audio blocked)
router.get('/*', async (req: Request, res: Response) => {
  try {
    // Get file path from params
    const filePath = req.params[0];
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const filename = filePath;
    const fullPath = path.join(getUploadDir(), filename);

    // Security: Prevent directory traversal
    const resolvedPath = path.resolve(fullPath);
    const uploadDir = path.resolve(getUploadDir());
    if (!resolvedPath.startsWith(uploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine file type from filename
    const isCoverImage = filename.includes('_cover');
    const isAudioFile = /\.(mp3|wav|ogg|m4a|flac)$/i.test(filename);

    // Audio files should only be accessed through /api/stream/[streamId] with token validation
    // Block direct access to audio files
    if (isAudioFile && !isCoverImage) {
      return res.status(403).json({ error: 'Audio files must be accessed through the stream endpoint' });
    }

    // For cover images, verify they belong to a valid track
    if (isCoverImage) {
      const db = await getDb();
      // Extract trackId from filename (format: [trackId]_cover.ext)
      const trackIdMatch = filename.match(/^([^_]+)_cover/);
      if (trackIdMatch) {
        const trackId = trackIdMatch[1];
        const track = await db.collection('tracks').findOne({ trackId });
        if (!track) {
          return res.status(404).json({ error: 'Track not found' });
        }
      }
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.mp3'
        ? 'audio/mpeg'
        : ext === '.wav'
        ? 'audio/wav'
        : ext === '.ogg'
        ? 'audio/ogg'
        : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.png'
        ? 'image/png'
        : ext === '.gif'
        ? 'image/gif'
        : ext === '.jfif'
        ? 'image/jpeg'
        : 'application/octet-stream';

    // Stream the file
    const stat = fs.statSync(resolvedPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Partial content request
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(resolvedPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Full file request
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      };
      res.writeHead(200, head);
      const file = fs.createReadStream(resolvedPath);
      file.pipe(res);
    }
  } catch (error: any) {
    console.error('File serve error:', error);
    res.status(500).json({ error: error.message || 'Failed to serve file' });
  }
});

export default router;

