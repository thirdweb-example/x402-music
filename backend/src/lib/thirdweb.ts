import { createThirdwebClient } from 'thirdweb';
import { facilitator } from 'thirdweb/x402';
import { arbitrum } from 'thirdweb/chains';

// Server-side client (for API routes)
export function getServerClient() {
  if (!process.env.THIRDWEB_SECRET_KEY) {
    throw new Error('THIRDWEB_SECRET_KEY is not set in environment variables');
  }

  return createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY,
  });
}

// Get facilitator for X402 payments
export function getFacilitator() {
  if (!process.env.THIRDWEB_SERVER_WALLET_ADDRESS) {
    throw new Error('THIRDWEB_SERVER_WALLET_ADDRESS is not set in environment variables');
  }

  const client = getServerClient();
  return facilitator({
    client,
    serverWalletAddress: process.env.THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`,
  });
}

// Get network (Arbitrum Mainnet)
export function getNetwork() {
  return arbitrum;
}

