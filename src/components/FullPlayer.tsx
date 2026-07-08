import { Play, Pause, ChevronDown, SkipBack, SkipForward, Heart, Share2, ListMusic } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { audioManager } from '../lib/audio';
import { useAppStore } from '../stores/appStore';
import { formatTime } from '../lib/utils';
import { useState } from 'react';

export function FullPlayer() {
  const audio = useAudioPlayer();
  const { isFullPlayerOpen, setFullPlayerOpen } = useAppStore();
  const [isLiked, setIsLiked] = useState(false);

  if (!isFullPlayerOpen || !audio.currentTrack) return null;

  const progress = audio.duration > 0 ? (audio.position / audio.duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-surface-0 animate-slide-up flex flex-col">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={audio.currentTrack.cover_url}
          alt=""
          className="w-full h-full object-cover blur-3xl scale-125 opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-0/50 via-surface-0/80 to-surface-0" />
      </div>

      <div className="relative flex flex-col h-full max-w-md mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setFullPlayerOpen(false)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </button>
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Now Playing</p>
          <button className="w-10 h-10 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform">
            <ListMusic className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
            <img
              src={audio.currentTrack.cover_url}
              alt={audio.currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-1000 ${audio.isPlaying ? 'scale-105' : 'scale-100'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          <div className="text-center w-full">
            <h2 className="font-display text-2xl font-bold text-white mb-1">
              {audio.currentTrack.title}
            </h2>
            <p className="text-white/50 text-lg">{audio.currentTrack.artist}</p>
          </div>

          <div className="w-full">
            <div
              className="relative h-1.5 bg-white/10 rounded-full cursor-pointer mb-2"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                audioManager.seek(pct * audio.duration);
              }}
            >
              <div
                className="absolute h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg"
                style={{ left: `calc(${progress}% - 7px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>{formatTime(audio.position)}</span>
              <span>{formatTime(audio.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Heart
                className={`w-7 h-7 ${isLiked ? 'fill-error-500 text-error-500' : 'text-white/60'}`}
              />
            </button>
            <button className="text-white/60 hover:scale-110 active:scale-95 transition-transform">
              <SkipBack className="w-8 h-8" fill="currentColor" />
            </button>
            <button
              onClick={() => audioManager.togglePlayPause()}
              className="w-16 h-16 rounded-full bg-white text-surface-0 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
            >
              {audio.isPlaying ? (
                <Pause className="w-7 h-7" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 ml-1" fill="currentColor" />
              )}
            </button>
            <button className="text-white/60 hover:scale-110 active:scale-95 transition-transform">
              <SkipForward className="w-8 h-8" fill="currentColor" />
            </button>
            <button className="text-white/60 hover:scale-110 active:scale-95 transition-transform">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
