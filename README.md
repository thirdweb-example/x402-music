# x402music.live

A pay-per-play music platform built with Next.js, MongoDB, and TailwindCSS.

**Upload your music, earn per stream, and embed your tracks anywhere with a simple iframe.**

**No middlemen. No gatekeepers. Just your music, your audience, your rewards.**

## Features

- **Artist Dashboard**: Upload tracks with title, cover image, price, and audio file
- **Pay-Per-Play with X402**: Listeners pay using crypto wallets (USDC) to unlock temporary streaming access (10 minutes)
- **Ephemeral Access**: Stream access expires after 10 minutes or on page refresh
- **Secure Streaming**: Partial content streaming prevents direct downloads
- **Dark Minimal UI**: Clean, modern interface with TailwindCSS
- **Web3 Integration**: Built-in wallet connection (MetaMask and more)

## Tech Stack

- **Next.js 14**: Frontend
- **Express**: Backend API server
- **MongoDB**: Track storage and transaction records
- **TailwindCSS**: Dark, minimal styling
- **Formidable**: File upload handling
- **Native HTML5 Audio**: Audio playback with range request support
- **Thirdweb X402**: Pay-per-request payment protocol for crypto payments

## Setup

This project consists of a **frontend** (Next.js) and a **backend** (Express) that need to be set up separately.

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the `backend` directory:
     ```
     MONGODB_URI=mongodb://localhost:27017/x402music
     THIRDWEB_SECRET_KEY=your-secret-key-here
     THIRDWEB_SERVER_WALLET_ADDRESS=0x...your-server-wallet-address
     PORT=3001
     NODE_ENV=development
     FRONTEND_URL=http://localhost:3000
     ```
   - Or for MongoDB Atlas:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/x402music
     ```

4. **Run the backend server**:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3001` by default.

### Frontend Setup

1. **Navigate to project root** (if not already there):
   ```bash
   cd ..
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env.local` file in the project root:
     ```
     NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id-here
     NEXT_PUBLIC_API_URL=http://localhost:3001
     ```
   - Get your Thirdweb Client ID from [thirdweb.com](https://thirdweb.com)

4. **Run the frontend development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   - Navigate to `http://localhost:3000`
   - Visit `/artist` for the artist dashboard

### Thirdweb X402 Setup

- Get your Thirdweb credentials:
  - Sign up at [thirdweb.com](https://thirdweb.com)
  - Create a new project and get your Client ID (for frontend)
  - Get your Secret Key from the dashboard (for backend)
- **Server Wallet**: Create a wallet address that will receive payments. You can generate one using Thirdweb's tools or any wallet generator.
- **Network**: The app uses Arbitrum Mainnet. Make sure your server wallet has some ETH for gas.

## Usage

### For Artists

1. Go to `/artist` dashboard
2. Fill in track details (title, artist, price)
3. Upload cover image (optional)
4. Upload audio file (MP3, WAV, etc.)
5. Click "Upload Track"

### For Listeners

1. Connect your wallet using the ConnectButton (supports MetaMask, Coinbase Wallet, Rainbow, and in-app wallet)
2. Browse available tracks on the home page
3. Click "Pay to Play" on any track
4. Approve the X402 payment transaction in your wallet (uses USDC on Arbitrum Mainnet)
5. Stream the track for 10 minutes
6. Access expires automatically or on page refresh

## API Routes (Backend)

All API routes are served by the Express backend server:

- `GET /api/tracks` - Get list of all tracks
- `GET /api/artist/tracks?artistWallet=...` - Get tracks for a specific artist
- `POST /api/upload` - Upload a new track
- `POST /api/pay/:trackId` - Process X402 payment and create stream session
- `POST /api/stream/:streamId` - Stream audio with token validation and expiry check
- `GET /api/stream/check/:streamId` - Check if a stream session is still valid
- `GET /api/file/*` - Serve cover images (audio files blocked for security)

## Project Structure

```
├── backend/                             # Express backend server
│   ├── src/
│   │   ├── routes/                      # API route handlers
│   │   │   ├── tracks.ts                # Tracks endpoints
│   │   │   ├── upload.ts                # Upload endpoint
│   │   │   ├── stream.ts                # Streaming endpoints
│   │   │   ├── file.ts                  # File serving endpoint
│   │   │   ├── pay.ts                   # Payment endpoint
│   │   │   └── artist.ts                # Artist endpoints
│   │   ├── lib/                         # Backend utilities
│   │   │   ├── mongodb.ts               # MongoDB connection
│   │   │   ├── upload.ts                # File upload utilities
│   │   │   └── thirdweb.ts             # Thirdweb server config
│   │   ├── app.ts                       # Express app setup
│   │   └── server.ts                   # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── pages/                               # Next.js frontend pages
│   ├── index.tsx                        # Home/Listener page
│   ├── artist.tsx                       # Artist dashboard
│   └── embed/[trackId].tsx              # Embeddable track player
├── components/
│   ├── AudioPlayer.tsx                  # Custom audio playback component
│   ├── CountdownTimer.tsx               # 10-minute countdown timer
│   ├── WalletConnect.tsx                # Wallet connection component
│   └── BuyWidget.tsx                    # Buy USDC widget for insufficient funds
├── lib/
│   ├── api.ts                           # API URL configuration
│   ├── types.ts                         # TypeScript interfaces
│   └── thirdweb.ts                      # Thirdweb client configuration (frontend)
└── public/
    └── favicon.svg                      # Site favicon
```

## Notes

- **Architecture**: Frontend (Next.js) and Backend (Express) are separated
- **API Communication**: Frontend calls backend API via `NEXT_PUBLIC_API_URL` environment variable
- Payments are processed in **USDC on Arbitrum Mainnet** using Thirdweb's X402 protocol
- Audio files are stored locally in `backend/uploads` (or `uploads` in backend directory)
- Consider using cloud storage (S3, Cloudinary) for production
- Stream sessions expire after 10 minutes
- Session persistence allows users to return within 10 minutes without re-paying
- Secure token-based streaming prevents unauthorized access
- No authentication - access is payment-based only
- Artists can embed tracks anywhere using iframe code from the dashboard

## License

MIT

