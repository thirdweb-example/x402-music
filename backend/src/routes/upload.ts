import { Router, Request, Response } from 'express';
import { parseForm, ensureUploadDir, getUploadDir } from '../lib/upload';
import { getDb } from '../lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    ensureUploadDir();
    const { fields, files } = await parseForm(req);

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const artist = Array.isArray(fields.artist) ? fields.artist[0] : fields.artist || 'Unknown Artist';
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
    const price = Array.isArray(fields.price) ? fields.price[0] : fields.price;
    const artistWallet = Array.isArray(fields.artistWallet) ? fields.artistWallet[0] : fields.artistWallet;
    const coverFile = Array.isArray(files.cover) ? files.cover[0] : files.cover;
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!title || !price || !audioFile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!artistWallet) {
      return res.status(400).json({ error: 'Artist wallet address required' });
    }

    const trackId = uuidv4();
    const uploadDir = getUploadDir();

    // Save audio file
    const audioExt = path.extname(audioFile.originalFilename || 'audio.mp3');
    const audioFilename = `${trackId}${audioExt}`;
    const audioPath = path.join(uploadDir, audioFilename);
    fs.renameSync(audioFile.filepath, audioPath);
    // Store relative path for API access (not public URL)
    const audioUrl = `/api/file/${trackId}${audioExt}`;

    // Save cover image if provided
    let coverUrl = '';
    if (coverFile) {
      const coverExt = path.extname(coverFile.originalFilename || 'cover.jpg');
      const coverFilename = `${trackId}_cover${coverExt}`;
      const coverPath = path.join(uploadDir, coverFilename);
      fs.renameSync(coverFile.filepath, coverPath);
      coverUrl = `/api/file/${trackId}_cover${coverExt}`;
    }

    // Save to MongoDB
    const db = await getDb();
    await db.collection('tracks').insertOne({
      trackId,
      title,
      artist,
      description: description || '',
      coverUrl,
      audioUrl,
      price: parseFloat(price),
      artistWalletAddress: artistWallet.toLowerCase(), // Store wallet address for filtering
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      trackId,
      message: 'Track uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

export default router;

