import { Play, Pause, ChevronUp, X } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { audioManager } from '../lib/audio';
import { useAppStore } from '../stores/appStore';
import { formatTime } from '../lib/utils';

export function MiniPlayer() {
  const audio = useAudioPlayer();
  const { isReelsActive, setFullPlayerOpen } = useAppStore();

  if (!audio.currentTrack || isReelsActive) return null;

  const progress = audio.duration > 0 ? (audio.position / audio.duration) * 100 : 0;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-3 animate-slide-up">
      <div className="glass-strong rounded-2xl shadow-2xl shadow-black/50 overflow-hidden max-w-md mx-auto">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-3 p-3">
          <div
            className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
            onClick={() => setFullPlayerOpen(true)}
          >
            {audio.currentTrack.cover_url ? (
              <img src={audio.currentTrack.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-500" />
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
              <ChevronUp className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
            </div>
          </div>

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setFullPlayerOpen(true)}
          >
            <p className="text-sm font-semibold text-white truncate">
              {audio.currentTrack.title}
            </p>
            <p className="text-xs text-white/50 truncate">
              {audio.currentTrack.artist}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => audioManager.togglePlayPause()}
              className="w-10 h-10 rounded-full bg-white text-surface-0 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              {audio.isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
              )}
            </button>
            <button
              onClick={() => audioManager.stop()}
              className="w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] text-white/30">
          <span>{formatTime(audio.position)}</span>
          <span>{formatTime(audio.duration)}</span>
        </div>
      </div>
    </div>
  );
}
