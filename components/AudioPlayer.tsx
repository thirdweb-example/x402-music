import { useEffect, useRef, useState } from 'react';
import { getApiUrl } from '@/lib/api';

interface AudioPlayerProps {
  streamUrl: string;
  title: string;
  autoPlay?: boolean;
  walletAddress?: string;
}

export default function AudioPlayer({ streamUrl, title, autoPlay = false, walletAddress }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !walletAddress) return;

    // Use direct streaming with token in query string
    // This ensures the stream is invalidated after 10 minutes
    try {
      // Extract streamId from streamUrl (format: /api/stream/[streamId])
      const streamId = streamUrl.split('/').pop();
      if (!streamId) return;

      // Build stream URL with token as query parameter
      const streamUrlWithToken = `${getApiUrl('/api/stream/' + streamId)}?token=${encodeURIComponent(walletAddress)}`;
      
      audio.src = streamUrlWithToken;
      audio.crossOrigin = 'anonymous';
      audio.volume = volume;
      audio.preload = 'metadata';

      // Try to play only if autoPlay is enabled
      if (autoPlay) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
    } catch (error: any) {
      console.error('Error setting up audio stream:', error);
      setError(error.message || 'Failed to load audio stream');
    }

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      const audio = audioRef.current;
      if (audio) {
        // Check if error is due to expired stream (403) or network error
        if (audio.error) {
          switch (audio.error.code) {
            case audio.error.MEDIA_ERR_ABORTED:
              setError('Stream loading aborted');
              break;
            case audio.error.MEDIA_ERR_NETWORK:
              setError('Network error - stream may have expired');
              break;
            case audio.error.MEDIA_ERR_DECODE:
              setError('Audio decode error');
              break;
            case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              setError('Stream expired or invalid');
              break;
            default:
              setError('Failed to play audio - stream may have expired');
          }
        } else {
          setError('Failed to play audio');
        }
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [streamUrl, walletAddress]);

  // Separate effect for volume updates
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = parseFloat(e.target.value);
    // Allow seeking anywhere, including to the end (up to duration)
    const seekTime = Math.max(0, Math.min(newTime, duration));
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="p-3 bg-white/5 border border-white/10 rounded-sm">
        <p className="text-white/60 text-xs">{error}</p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full">
      <audio ref={audioRef} preload="auto" />
      
      {/* Custom Player Controls */}
      <div className="bg-black border border-white/10 rounded-sm p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={!duration || duration === 0}
            className="w-full h-1 bg-white/10 rounded-sm appearance-none cursor-pointer slider disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: duration > 0 
                ? `linear-gradient(to right, white 0%, white ${progress}%, rgba(255,255,255,0.1) ${progress}%, rgba(255,255,255,0.1) 100%)`
                : undefined
            }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-white/90 rounded-sm transition-all flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Time Display */}
          <div className="flex items-center gap-1.5 text-xs text-white font-mono flex-shrink-0">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/30">/</span>
            <span className="text-white/40">{formatTime(duration)}</span>
          </div>

          {/* Progress Bar (visual) */}
          <div className="flex-1 h-0.5 bg-white/10 rounded-sm overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.617-3.793a1 1 0 011.383-.131zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/10 rounded-sm appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-white/30 mt-3 line-clamp-1">Now playing: {title}</p>
    </div>
  );
}
