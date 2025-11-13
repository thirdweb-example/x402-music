import { Router, Request, Response } from 'express';
import { getDb } from '../lib/mongodb';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const tracks = await db
      .collection('tracks')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Return only public fields
    const publicTracks = tracks.map((track) => ({
      trackId: track.trackId,
      title: track.title,
      artist: track.artist,
      description: track.description || '',
      coverUrl: track.coverUrl,
      price: track.price,
      createdAt: track.createdAt,
    }));

    res.status(200).json({ tracks: publicTracks });
  } catch (error: any) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tracks' });
  }
});

export default router;

