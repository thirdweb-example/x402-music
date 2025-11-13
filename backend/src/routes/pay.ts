import { Router, Request, Response } from 'express';
import { getDb } from '../lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { settlePayment } from 'thirdweb/x402';
import { getFacilitator, getNetwork } from '../lib/thirdweb';
import crypto from 'crypto';

const router = Router();

// POST /api/pay/:trackId - Process payment and create stream session
router.post('/:trackId', async (req: Request, res: Response) => {
  try {
    const { trackId } = req.params;

    if (!trackId || typeof trackId !== 'string') {
      return res.status(400).json({ error: 'Invalid trackId' });
    }

    const db = await getDb();

    // Verify track exists
    const track = await db.collection('tracks').findOne({ trackId });
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Get payment data from headers (sent by X402 wrapped fetch)
    const paymentData = req.headers['x-payment'] as string | undefined;
    
    // Get wallet address from request body (sent by frontend)
    let payerWalletAddress: string | undefined;
    payerWalletAddress = req.body?.walletAddress;

    // Get the full URL for the resource
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const resourceUrl = `${protocol}://${host}/api/pay/${trackId}`;

    // Settle X402 payment - pay to the artist who uploaded the track
    const facilitator = getFacilitator();
    const network = getNetwork();
    const artistWalletAddress = track.artistWalletAddress as `0x${string}`;

    if (!artistWalletAddress) {
      return res.status(400).json({ error: 'Track artist wallet address not found' });
    }

    const result = await settlePayment({
      resourceUrl,
      method: 'POST',
      paymentData: paymentData || undefined,
      payTo: artistWalletAddress,
      network,
      price: `$${track.price.toFixed(2)}`, // Price in USD
      facilitator,
      routeConfig: {
        description: `Access to stream: ${track.title}`,
        mimeType: 'application/json',
        maxTimeoutSeconds: 600, // 10 minutes
      },
    });

    // If payment is required (402 or other status), return the payment response
    if (result.status !== 200) {
      // Set headers from X402 response
      if (result.responseHeaders) {
        Object.entries(result.responseHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      return res.status(result.status).json(result.responseBody);
    }

    // Payment verified and settled successfully
    // Use wallet address from request body, or try to extract from payment data
    if (!payerWalletAddress && paymentData) {
      try {
        const paymentDataObj = JSON.parse(paymentData);
        payerWalletAddress = paymentDataObj.payerAddress || paymentDataObj.from;
      } catch (e) {
        // If paymentData is not JSON, try to extract from result
      }
    }
    
    // Also try to get from result if available
    if (!payerWalletAddress && result.paymentReceipt?.payer) {
      payerWalletAddress = result.paymentReceipt.payer;
    }

    // If still no wallet address, log warning but continue (for backward compatibility)
    if (!payerWalletAddress) {
      console.warn('WARNING: No wallet address found for payment. Stream will be created without wallet verification.');
    }

    // Create stream session (expires in 10 minutes)
    const streamId = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Generate secure access token (32 bytes random)
    const accessToken = crypto.randomBytes(32).toString('hex');

    const streamData = {
      streamId,
      trackId,
      expiresAt,
      payerWalletAddress: payerWalletAddress ? payerWalletAddress.toLowerCase() : null,
      accessToken,
      createdAt: new Date(),
    };

    await db.collection('streams').insertOne(streamData);

    // Record transaction
    await db.collection('transactions').insertOne({
      trackId,
      streamId,
      amount: track.price,
      createdAt: new Date(),
      paymentTxHash: result.paymentReceipt?.transaction,
    });

    res.status(200).json({
      success: true,
      streamId,
      expiresAt: expiresAt.toISOString(),
      accessToken,
      message: 'Payment successful',
      txHash: result.paymentReceipt?.transaction,
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    res.status(500).json({ error: error.message || 'Payment failed' });
  }
});

export default router;

