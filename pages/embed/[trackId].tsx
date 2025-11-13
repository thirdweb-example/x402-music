import { useState, useEffect } from 'react';
import Head from 'next/head';
import AudioPlayer from '@/components/AudioPlayer';
import CountdownTimer from '@/components/CountdownTimer';
import WalletConnect from '@/components/WalletConnect';
import BuyWidgetComponent from '@/components/BuyWidget';
import { wrapFetchWithPayment } from 'thirdweb/x402';
import { getClient } from '@/lib/thirdweb';
import { useActiveWallet } from 'thirdweb/react';
import { useRouter } from 'next/router';
import { getApiUrl } from '@/lib/api';

interface Track {
  trackId: string;
  title: string;
  artist: string;
  description?: string;
  coverUrl: string;
  price: number;
}

export default function EmbedPlayer() {
  const router = useRouter();
  const { trackId } = router.query;
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState<{
    streamId: string;
    trackId: string;
    title: string;
    expiresAt: string;
    accessToken?: string;
  } | null>(null);
  const [paying, setPaying] = useState(false);
  const [showBuyWidget, setShowBuyWidget] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const wallet = useActiveWallet();

  useEffect(() => {
    if (trackId && typeof trackId === 'string') {
      fetchTrack(trackId);
    }
  }, [trackId]);

  // Check stored stream after wallet is available
  useEffect(() => {
    if (trackId && typeof trackId === 'string' && wallet) {
      checkStoredStream(trackId);
    }
  }, [trackId, wallet]);

  const checkStoredStream = async (id: string) => {
    try {
      // Check localStorage for stored stream session
      const stored = localStorage.getItem(`stream_${id}`);
      if (stored) {
        const streamData = JSON.parse(stored);
        const expiresAt = new Date(streamData.expiresAt);
        
        // Check if still valid (not expired)
        if (new Date() < expiresAt) {
          // Verify with backend that stream is still valid
          const walletAddr = wallet?.getAccount()?.address;
          
          // Only check if wallet is connected
          if (!walletAddr) {
            return; // Wait for wallet to connect
          }
          
          // Only restore if we have an access token (new streams)
          // Old streams without tokens need to be re-purchased
          if (!streamData.accessToken) {
            localStorage.removeItem(`stream_${id}`);
            return;
          }

          const checkUrl = getApiUrl(`/api/stream/check/${streamData.streamId}?token=${encodeURIComponent(streamData.accessToken)}`);
          const res = await fetch(checkUrl);
          
          if (res.ok) {
            const data = await res.json();
            if (data.valid) {
              setActiveStream({
                streamId: streamData.streamId,
                trackId: id,
                title: data.title || streamData.title,
                expiresAt: streamData.expiresAt,
                accessToken: streamData.accessToken, // Make sure token is included
              });
              setIsRestored(true); // Mark as restored session
            } else {
              // Stream expired or invalid, remove from localStorage
              localStorage.removeItem(`stream_${id}`);
            }
          } else {
            // If unauthorized or error, remove from localStorage
            const errorData = await res.json().catch(() => ({}));
            if (res.status === 403) {
              localStorage.removeItem(`stream_${id}`);
            }
          }
        } else {
          // Expired, remove from localStorage
          localStorage.removeItem(`stream_${id}`);
        }
      }
    } catch (error) {
      console.error('Error checking stored stream:', error);
    }
  };

  const fetchTrack = async (id: string) => {
    try {
      const res = await fetch(getApiUrl('/api/tracks'));
      const data = await res.json();
      const foundTrack = data.tracks?.find((t: Track) => t.trackId === id);
      if (foundTrack) {
        setTrack(foundTrack);
      }
    } catch (error) {
      console.error('Error fetching track:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!wallet || !track) {
      alert('Please connect your wallet first');
      return;
    }

    setPaying(true);
    try {
      const client = getClient();
      const maxValue = BigInt(Math.ceil(track.price * 10 ** 6));
      
      const fetchWithPay = wrapFetchWithPayment(
        fetch,
        client,
        wallet,
        maxValue
      );

      // Get wallet address
      const walletAddress = wallet.getAccount()?.address;
      
      const res = await fetchWithPay(
        getApiUrl(`/api/pay/${track.trackId}`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress }),
        }
      );

      const data = await res.json();

      if (data.success) {
        const streamData = {
          streamId: data.streamId,
          trackId: track.trackId,
          title: track.title,
          expiresAt: data.expiresAt,
          accessToken: data.accessToken, // Store access token
        };
        setActiveStream(streamData);
        setShowBuyWidget(false);
        setIsRestored(false); // Fresh payment, not restored
        
        // Store in localStorage for persistence
        localStorage.setItem(`stream_${track.trackId}`, JSON.stringify(streamData));
      } else {
        // Check if error is insufficient funds
        const errorMsg = data.error || '';
        if (errorMsg.toLowerCase().includes('insufficient_funds') || 
            errorMsg.toLowerCase().includes('insufficient funds')) {
          setShowBuyWidget(true);
        } else {
          alert('Payment failed: ' + errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMsg = error.message || 'Please try again.';
      if (errorMsg.toLowerCase().includes('insufficient_funds') || 
          errorMsg.toLowerCase().includes('insufficient funds')) {
        setShowBuyWidget(true);
      } else {
        alert('Payment failed: ' + errorMsg);
      }
    } finally {
      setPaying(false);
    }
  };

  const handleExpire = () => {
    setActiveStream(null);
    // Remove from localStorage when expired
    if (track) {
      localStorage.removeItem(`stream_${track.trackId}`);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white mx-auto mb-3"></div>
          <p className="text-white/40 text-sm">Loading track...</p>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/60 text-base mb-1">Track not found</p>
          <p className="text-white/30 text-xs">The track doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{track.title} - x402music.live</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          #__next {
            height: 100%;
          }
        `}</style>
      </Head>

      <div className="h-full w-full bg-black overflow-hidden">
        <div className="h-full flex flex-col">
          {track.coverUrl && (
            <div className="relative h-80 bg-black overflow-hidden flex-shrink-0 border-b border-white/10">
              <img
                src={getApiUrl(track.coverUrl)}
                alt={track.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              {!activeStream && (
                <div className="absolute top-3 right-3 z-10">
                  <WalletConnect />
                </div>
              )}
            </div>
          )}

          <div className="flex-1 bg-black border-t border-white/10 p-5 flex flex-col min-h-0">
            <div className="mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-white mb-1 leading-tight line-clamp-2">
                {track.title}
              </h2>
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-2">
                {track.artist}
              </p>
              {track.description && (
                <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                  {track.description}
                </p>
              )}
            </div>

            {activeStream ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 flex-shrink-0">
                  <CountdownTimer
                    expiresAt={activeStream.expiresAt}
                    onExpire={handleExpire}
                  />
                </div>
                <div className="flex-1 min-h-0">
                  <AudioPlayer
                    streamUrl={getApiUrl(`/api/stream/${activeStream.streamId}`)}
                    title={track.title}
                    autoPlay={!isRestored}
                    walletAddress={activeStream.accessToken || wallet?.getAccount()?.address}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-end min-h-0">
                {showBuyWidget ? (
                  <div className="mb-3 flex-shrink-0">
                    <BuyWidgetComponent
                      amount={track.price.toFixed(2)}
                      onClose={() => setShowBuyWidget(false)}
                    />
                  </div>
                ) : (
                  <>
                    {!track.coverUrl && (
                      <div className="mb-3 flex-shrink-0">
                        <WalletConnect />
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10 flex-shrink-0">
                      <div>
                        <p className="text-xs text-white/30 mb-1 uppercase tracking-wider font-light">Price</p>
                        <span className="text-3xl font-bold text-white">
                          ${track.price.toFixed(2)}
                        </span>
                        <p className="text-xs text-white/30 mt-1">USDC on Arbitrum</p>
                      </div>
                      <button
                        onClick={handlePay}
                        disabled={!wallet || paying}
                        className="px-8 py-3 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed transition-all font-semibold text-sm rounded-sm border border-white/20 disabled:border-white/5"
                      >
                        {paying ? 'Processing...' : 'Pay to Play'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

