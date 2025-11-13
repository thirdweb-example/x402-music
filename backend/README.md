# x402music Backend

Express-based backend server for x402music.live

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your configuration:
```bash
cp .env.example .env
```

3. Update `.env` with your:
   - MongoDB connection string
   - Thirdweb secret key
   - Thirdweb server wallet address
   - Frontend URL (for CORS)

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

The server will run on port 3001 by default (or the port specified in `PORT` environment variable).

## API Endpoints

- `GET /api/tracks` - Get all tracks
- `GET /api/artist/tracks?artistWallet=...` - Get tracks by artist wallet
- `POST /api/upload` - Upload a new track
- `POST /api/pay/:trackId` - Process payment and create stream session
- `POST /api/stream/:streamId` - Stream audio file
- `GET /api/stream/check/:streamId` - Check stream validity
- `GET /api/file/*` - Serve cover images (audio files blocked)

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `THIRDWEB_SECRET_KEY` - Thirdweb secret key
- `THIRDWEB_SERVER_WALLET_ADDRESS` - Server wallet address for X402 payments
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS configuration

