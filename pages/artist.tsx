import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useActiveWallet } from 'thirdweb/react';
import WalletConnect from '@/components/WalletConnect';
import { getApiUrl } from '@/lib/api';

interface Track {
  trackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  price: number;
  createdAt: string;
}

function TrackItem({ track }: { track: Track }) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/embed/${track.trackId}`
    : `https://x402music.live/embed/${track.trackId}`;
  const embedCode = `<iframe src="${embedUrl}" width="400" height="650" frameborder="0" allowtransparency="true"></iframe>`;

  return (
    <div className="bg-black border border-white/10 rounded-sm p-4">
      <div className="flex gap-4">
        {track.coverUrl && (
          <img
            src={getApiUrl(track.coverUrl)}
            alt={track.title}
            className="w-20 h-20 object-cover rounded-sm border border-white/10 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">
                {track.title}
              </h3>
              <p className="text-sm text-white/50">{track.artist}</p>
            </div>
            <div className="ml-4 flex-shrink-0 text-right">
              <p className="text-lg font-bold text-white">
                ${track.price.toFixed(2)}
              </p>
              <p className="text-xs text-white/30 mt-0.5">USDC on Arbitrum</p>
            </div>
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={() => {
              setShowEmbed(!showEmbed);
              setCopied(false);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 hover:border-white/20 transition-all text-white group mt-2"
          >
            <span className="text-xs font-medium uppercase tracking-wider">
              {showEmbed ? 'Hide' : 'Show'} Embed Code
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showEmbed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Embed Code Section */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showEmbed ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
            }`}
          >
            <div className="p-4 bg-black border border-white/10 rounded-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-xs text-white/60 uppercase tracking-wider font-medium">Embed Code</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-white/90 rounded-sm transition-all text-xs font-semibold"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                value={embedCode}
                className="w-full px-3 py-2.5 text-xs bg-black border border-white/10 rounded-sm text-white font-mono focus:outline-none focus:border-white/20 transition-colors resize-none"
                rows={3}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <p className="text-xs text-white/40 mt-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Copy this code to embed on your website
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArtistDashboard() {
  const wallet = useActiveWallet();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    price: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (wallet?.getAccount()?.address) {
      fetchTracks();
    } else {
      setTracks([]);
    }
  }, [wallet]);

  const fetchTracks = async () => {
    const account = wallet?.getAccount();
    if (!account?.address) return;
    
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/artist/tracks?artistWallet=${account.address}`));
      const data = await res.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmittingRef.current || uploading) {
      return;
    }
    
    const account = wallet?.getAccount();
    if (!account?.address) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!formData.title || !formData.price || !audioFile) {
      alert('Please fill in all required fields');
      return;
    }

    isSubmittingRef.current = true;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title);
      uploadFormData.append('artist', formData.artist || 'Unknown Artist');
      uploadFormData.append('description', formData.description || '');
      uploadFormData.append('price', formData.price);
      uploadFormData.append('artistWallet', account.address);
      if (coverFile) {
        uploadFormData.append('cover', coverFile);
      }
      uploadFormData.append('audio', audioFile);

      const res = await fetch(getApiUrl('/api/upload'), {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();

      if (data.success) {
        alert('Track uploaded successfully!');
        setFormData({ title: '', artist: '', description: '', price: '' });
        setCoverFile(null);
        setAudioFile(null);
        fetchTracks();
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <>
      <Head>
        <title>Artist Dashboard - x402music.live</title>
        <meta name="description" content="Upload your tracks" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-black">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-12 pb-8 border-b border-white/10">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">Artist Dashboard</h1>
              <p className="text-white/40 text-xs sm:text-sm font-light uppercase tracking-wider">Upload and manage your tracks</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <WalletConnect />
              <Link
                href="/"
                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-all text-white text-sm text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {!wallet?.getAccount()?.address && (
            <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-sm">
              <p className="text-white/60">
                Please connect your wallet to upload tracks and view your dashboard.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Form */}
            <div className="bg-black border border-white/10 rounded-sm p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Upload New Track
              </h2>
              {(() => {
                const account = wallet?.getAccount();
                return account?.address ? (
                  <p className="text-xs text-white/40 mb-4 font-mono">
                    Connected as: {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </p>
                ) : null;
              })()}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Artist
                  </label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) =>
                      setFormData({ ...formData, artist: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30 resize-none transition-colors"
                    placeholder="Add a description for your track..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Price (USDC) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                  <p className="text-xs text-white/40 mt-1.5">Payments are processed in USDC on Arbitrum</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Cover Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setCoverFile(e.target.files?.[0] || null)
                    }
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-sm text-white/60 file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Audio File * (MP3, WAV, etc.)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) =>
                      setAudioFile(e.target.files?.[0] || null)
                    }
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-sm text-white/60 file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !wallet?.getAccount()?.address}
                  className="w-full px-4 py-3 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed transition-all font-semibold rounded-sm border border-white/20 disabled:border-white/5"
                >
                  {!wallet?.getAccount()?.address
                    ? 'Connect Wallet to Upload'
                    : uploading
                    ? 'Uploading...'
                    : 'Upload Track'}
                </button>
              </form>
            </div>

            {/* Track List */}
            <div className="bg-black border border-white/10 rounded-sm p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Your Tracks
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white mx-auto mb-3"></div>
                    <p className="text-white/40 text-sm">Loading tracks...</p>
                  </div>
                </div>
              ) : tracks.length === 0 ? (
                <p className="text-white/40">No tracks uploaded yet.</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {tracks.map((track) => (
                    <TrackItem key={track.trackId} track={track} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

