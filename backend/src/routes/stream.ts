import { Router, Request, Response } from 'express';
import { getDb } from '../lib/mongodb';
import { getUploadDir } from '../lib/upload';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET /api/stream/:streamId - Stream audio file (for direct audio element access)
router.get('/:streamId', async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const token = req.query.token as string;

    if (!streamId || typeof streamId !== 'string') {
      return res.status(400).json({ error: 'Invalid streamId' });
    }

    if (!token || typeof token !== 'string') {
      return res.status(403).json({ error: 'Access token required' });
    }

    // Check referrer to prevent direct URL access
    const ref = req.headers.referer || req.headers.origin || '';
    const allowedDomains = ['x402music.live', 'localhost:3000', '127.0.0.1:3000'];
    
    // If referrer is provided, it must be from allowed domain
    if (ref && !allowedDomains.some(domain => ref.includes(domain))) {
      return res.status(403).json({ error: 'Unauthorized: invalid referrer' });
    }

    const db = await getDb();

    // Verify stream session
    const stream = await db.collection('streams').findOne({ streamId });
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Check if expired
    if (new Date() > new Date(stream.expiresAt)) {
      return res.status(403).json({ error: 'Stream expired' });
    }

    // Verify access token matches
    if (stream.accessToken) {
      if (stream.accessToken !== token) {
        return res.status(403).json({ error: 'Invalid access token' });
      }
    } else {
      // Backward compatibility: if no token, check wallet address
      const payerWallet = req.query.wallet as string | undefined;
      if (stream.payerWalletAddress) {
        if (!payerWallet) {
          return res.status(403).json({ error: 'Wallet address required' });
        }
        const streamWallet = stream.payerWalletAddress.toLowerCase();
        const requestWallet = payerWallet.toLowerCase();
        if (streamWallet !== requestWallet) {
          return res.status(403).json({ error: 'Unauthorized: Wallet address does not match' });
        }
      }
    }

    // Get track info
    const track = await db.collection('tracks').findOne({
      trackId: stream.trackId,
    });
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Get audio file path from uploads directory
    const filename = track.audioUrl.split('/').pop();
    const audioPath = path.join(getUploadDir(), filename || '');
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Determine content type based on file extension
    const ext = path.extname(track.audioUrl).toLowerCase();
    const contentType =
      ext === '.mp3'
        ? 'audio/mpeg'
        : ext === '.wav'
        ? 'audio/wav'
        : ext === '.ogg'
        ? 'audio/ogg'
        : 'audio/mpeg';

    // Headers to prevent downloads and force inline playback
    const commonHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    };

    if (range) {
      // Partial content request - streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(audioPath, { start, end });
      const head = {
        ...commonHeaders,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Initial request - send headers to enable range requests
      const head = {
        ...commonHeaders,
        'Content-Length': fileSize,
      };
      res.writeHead(200, head);
      const file = fs.createReadStream(audioPath);
      file.pipe(res);
    }
  } catch (error: any) {
    console.error('Stream error:', error);
    res.status(500).json({ error: error.message || 'Stream failed' });
  }
});

// POST /api/stream/:streamId - Stream audio file (backward compatibility)
router.post('/:streamId', async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const token = req.body?.token || (req.query.token as string);

    if (!streamId || typeof streamId !== 'string') {
      return res.status(400).json({ error: 'Invalid streamId' });
    }

    if (!token || typeof token !== 'string') {
      return res.status(403).json({ error: 'Access token required' });
    }

    // Check referrer to prevent direct URL access
    const ref = req.headers.referer || req.headers.origin || '';
    const allowedDomains = ['x402music.live', 'localhost:3000', '127.0.0.1:3000'];
    
    // If referrer is provided, it must be from allowed domain
    if (ref && !allowedDomains.some(domain => ref.includes(domain))) {
      return res.status(403).json({ error: 'Unauthorized: invalid referrer' });
    }

    const db = await getDb();

    // Verify stream session
    const stream = await db.collection('streams').findOne({ streamId });
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Check if expired
    if (new Date() > new Date(stream.expiresAt)) {
      return res.status(403).json({ error: 'Stream expired' });
    }

    // Verify access token matches
    if (stream.accessToken) {
      if (stream.accessToken !== token) {
        return res.status(403).json({ error: 'Invalid access token' });
      }
    } else {
      // Backward compatibility: if no token, check wallet address
      const payerWallet = req.query.wallet as string | undefined;
      if (stream.payerWalletAddress) {
        if (!payerWallet) {
          return res.status(403).json({ error: 'Wallet address required' });
        }
        const streamWallet = stream.payerWalletAddress.toLowerCase();
        const requestWallet = payerWallet.toLowerCase();
        if (streamWallet !== requestWallet) {
          return res.status(403).json({ error: 'Unauthorized: Wallet address does not match' });
        }
      }
    }

    // Get track info
    const track = await db.collection('tracks').findOne({
      trackId: stream.trackId,
    });
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Get audio file path from uploads directory
    const filename = track.audioUrl.split('/').pop();
    const audioPath = path.join(getUploadDir(), filename || '');
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    // For POST requests, range might be in body or headers
    const range = req.body?.range || req.headers.range;

    // Determine content type based on file extension
    const ext = path.extname(track.audioUrl).toLowerCase();
    const contentType =
      ext === '.mp3'
        ? 'audio/mpeg'
        : ext === '.wav'
        ? 'audio/wav'
        : ext === '.ogg'
        ? 'audio/ogg'
        : 'audio/mpeg';

    // Headers to prevent downloads and force inline playback
    const commonHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    };

    if (range) {
      // Partial content request - streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(audioPath, { start, end });
      const head = {
        ...commonHeaders,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Initial request - send headers to enable range requests
      const head = {
        ...commonHeaders,
        'Content-Length': fileSize,
      };
      res.writeHead(200, head);
      const file = fs.createReadStream(audioPath);
      file.pipe(res);
    }
  } catch (error: any) {
    console.error('Stream error:', error);
    res.status(500).json({ error: error.message || 'Stream failed' });
  }
});

// GET /api/stream/check/:streamId - Check stream validity
router.get('/check/:streamId', async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const { token, wallet } = req.query;

    if (!streamId || typeof streamId !== 'string') {
      return res.status(400).json({ error: 'Invalid streamId' });
    }

    const db = await getDb();

    // Verify stream session
    const stream = await db.collection('streams').findOne({ streamId });
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Check if expired
    if (new Date() > new Date(stream.expiresAt)) {
      return res.status(403).json({ error: 'Stream expired' });
    }

    // Verify access token if available (new method)
    if (stream.accessToken) {
      if (!token || token !== stream.accessToken) {
        return res.status(403).json({ error: 'Invalid access token' });
      }
    } else {
      // Backward compatibility: check wallet address
      const payerWallet = (wallet as string) || (req.headers['x-payer-wallet'] as string | undefined);
      if (stream.payerWalletAddress) {
        if (!payerWallet) {
          return res.status(403).json({ error: 'Wallet address required' });
        }
        const streamWallet = stream.payerWalletAddress.toLowerCase();
        const requestWallet = payerWallet.toLowerCase();
        if (streamWallet !== requestWallet) {
          return res.status(403).json({ error: 'Unauthorized: Wallet address does not match' });
        }
      }
    }

    // Get track info
    const track = await db.collection('tracks').findOne({
      trackId: stream.trackId,
    });
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Stream is valid
    res.status(200).json({
      valid: true,
      streamId: stream.streamId,
      trackId: stream.trackId,
      expiresAt: stream.expiresAt,
      title: track.title,
    });
  } catch (error: any) {
    console.error('Stream check error:', error);
    res.status(500).json({ error: error.message || 'Stream check failed' });
  }
});

export default router;

