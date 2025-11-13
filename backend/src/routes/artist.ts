import { Router, Request, Response } from 'express';
import { getDb } from '../lib/mongodb';

const router = Router();

// GET /api/artist/tracks?artistWallet=... - Get tracks by artist wallet
router.get('/tracks', async (req: Request, res: Response) => {
  try {
    const { artistWallet } = req.query;

    if (!artistWallet || typeof artistWallet !== 'string') {
      return res.status(400).json({ error: 'Artist wallet address required' });
    }

    const db = await getDb();
    const tracks = await db
      .collection('tracks')
      .find({ artistWalletAddress: artistWallet.toLowerCase() })
      .sort({ createdAt: -1 })
      .toArray();

    // Return all fields for artist's own tracks
    const artistTracks = tracks.map((track) => ({
      trackId: track.trackId,
      title: track.title,
      artist: track.artist,
      description: track.description || '',
      coverUrl: track.coverUrl,
      audioUrl: track.audioUrl,
      price: track.price,
      createdAt: track.createdAt,
    }));

    res.status(200).json({ tracks: artistTracks });
  } catch (error: any) {
    console.error('Error fetching artist tracks:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tracks' });
  }
});

export default router;

