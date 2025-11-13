import express from 'express';
import cors from 'cors';
import tracksRouter from './routes/tracks';
import uploadRouter from './routes/upload';
import streamRouter from './routes/stream';
import fileRouter from './routes/file';
import payRouter from './routes/pay';
import artistRouter from './routes/artist';

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/tracks', tracksRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/stream', streamRouter);
app.use('/api/file', fileRouter);
app.use('/api/pay', payRouter);
app.use('/api/artist', artistRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;

