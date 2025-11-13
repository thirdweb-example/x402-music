import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import { getApiUrl } from '@/lib/api';

interface Track {
  trackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  price: number;
  createdAt: string;
}

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [displayedTracks, setDisplayedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const tracksPerPage = 9; // 3x3 grid

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    // Update displayed tracks when tracks or page changes
    const endIndex = page * tracksPerPage;
    setDisplayedTracks(tracks.slice(0, endIndex));
  }, [tracks, page]);

  const fetchTracks = async () => {
    try {
      const res = await fetch(getApiUrl('/api/tracks'));
      const data = await res.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setLoadingMore(true);
    // Simulate slight delay for better UX
    setTimeout(() => {
      setPage(prev => prev + 1);
      setLoadingMore(false);
    }, 300);
  };

  const hasMore = displayedTracks.length < tracks.length;

  return (
    <>
      <Head>
        <title>x402music.live - Pay Per Play</title>
        <meta name="description" content="Pay-per-play music platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <main className="min-h-screen bg-black">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-12 pb-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#FF00FF] rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v9.12c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">x402music.live</h1>
                <p className="text-white/40 text-xs sm:text-sm font-light uppercase tracking-wider">Pay-per-play music platform</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <WalletConnect />
              <Link
                href="/artist"
                className="px-6 py-2.5 bg-white text-black hover:bg-white/90 transition-all font-medium text-sm rounded-sm border border-white/20 text-center"
              >
                Artist Dashboard
              </Link>
            </div>
          </div>

          {/* Tracks Grid */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Available Tracks
              </h2>
              {!loading && tracks.length > 0 && (
                <span className="text-sm text-white/30 font-light">
                  Showing {displayedTracks.length} of {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white mx-auto mb-3"></div>
                  <p className="text-white/40 text-sm">Loading tracks...</p>
                </div>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/40 text-lg mb-1">No tracks available yet.</p>
                <p className="text-white/20 text-sm">Be the first to upload!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayedTracks.map((track) => (
                    <div
                      key={track.trackId}
                      className="bg-black border border-white/10 rounded-sm overflow-hidden hover:border-white/20 transition-all"
                    >
                      <iframe
                        src={`/embed/${track.trackId}`}
                        width="100%"
                        height="650"
                        frameBorder="0"
                        allowTransparency={true}
                        className="w-full bg-black"
                        style={{ minHeight: '600px' }}
                      />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed transition-all font-semibold rounded-sm border border-white/20 disabled:border-white/5"
                    >
                      {loadingMore ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      ) : (
                        `Load More (${tracks.length - displayedTracks.length} remaining)`
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-16 pb-12 border-t border-white/10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">x402music.live</h3>
              <p className="text-white/50 text-base leading-relaxed mb-4 max-w-xl mx-auto">
                Upload your music, earn per stream, and embed your tracks anywhere with a simple iframe.
              </p>
            </div>
            <div className="text-center pt-8 border-t border-white/5">
              <p className="text-white/30 text-xs uppercase tracking-[0.2em] font-light">
                No middlemen. No gatekeepers. Just your music, your audience, your rewards.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

