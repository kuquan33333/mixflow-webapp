import { Howl } from 'howler';
import type { MusicTrack } from './types';

export type AudioState = {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
};

type Listener = (state: AudioState) => void;

class AudioManager {
  private howl: Howl | null = null;
  private currentTrack: MusicTrack | null = null;
  private isPlaying = false;
  private position = 0;
  private duration = 0;
  private listeners = new Set<Listener>();
  private rafId: number | null = null;
  private wasPlayingBeforeInterrupt = false;
  private interruptHowl: Howl | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  getState(): AudioState {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      position: this.position,
      duration: this.duration,
    };
  }

  private startProgressLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    const update = () => {
      if (this.howl && this.isPlaying) {
        this.position = this.howl.seek() as number;
        this.notify();
        this.rafId = requestAnimationFrame(update);
      }
    };
    this.rafId = requestAnimationFrame(update);
  }

  private stopProgressLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  play(track: MusicTrack, startFrom = 0) {
    if (this.currentTrack?.id === track.id && this.howl) {
      this.howl.play();
      this.isPlaying = true;
      this.startProgressLoop();
      this.notify();
      return;
    }

    this.stopInternal();

    this.currentTrack = track;
    this.duration = track.duration;
    this.position = startFrom;

    this.howl = new Howl({
      src: [track.url],
      html5: true,
      format: ['mp3'],
    });

    this.howl.on('play', () => {
      this.isPlaying = true;
      if (startFrom > 0) this.howl?.seek(startFrom);
      this.startProgressLoop();
      this.notify();
    });

    this.howl.on('pause', () => {
      this.isPlaying = false;
      this.stopProgressLoop();
      this.notify();
    });

    this.howl.on('end', () => {
      this.isPlaying = false;
      this.position = 0;
      this.stopProgressLoop();
      this.notify();
    });

    this.howl.on('load', () => {
      this.duration = this.howl?.duration() || track.duration;
      this.notify();
    });

    this.howl.play();
  }

  togglePlayPause() {
    if (!this.howl || !this.currentTrack) return;
    if (this.isPlaying) {
      this.howl.pause();
    } else {
      this.howl.play();
    }
  }

  pause() {
    if (this.howl && this.isPlaying) {
      this.position = this.howl.seek() as number;
      this.howl.pause();
    }
  }

  resume() {
    if (this.howl && !this.isPlaying && this.currentTrack) {
      this.howl.play();
    }
  }

  stop() {
    this.stopInternal();
    this.currentTrack = null;
    this.position = 0;
    this.duration = 0;
    this.notify();
  }

  private stopInternal() {
    this.stopProgressLoop();
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }
    this.isPlaying = false;
  }

  seek(seconds: number) {
    if (this.howl) {
      this.howl.seek(seconds);
      this.position = seconds;
      this.notify();
    }
  }

  // Interrupt: pause background track, play a preview clip
  playPreview(track: MusicTrack, start: number, end: number, onEnd?: () => void) {
    this.wasPlayingBeforeInterrupt = this.isPlaying;
    this.pause();

    this.stopPreview();

    this.interruptHowl = new Howl({
      src: [track.url],
      html5: true,
      format: ['mp3'],
    });

    this.interruptHowl.on('play', () => {
      if (start > 0) this.interruptHowl?.seek(start);
    });

    this.interruptHowl.on('end', () => {
      this.stopPreview();
      onEnd?.();
    });

    this.interruptHowl.play();

    if (end > start && end > 0) {
      const checkEnd = () => {
        if (!this.interruptHowl) return;
        const pos = this.interruptHowl.seek() as number;
        if (pos >= end) {
          this.stopPreview();
          onEnd?.();
        } else {
          requestAnimationFrame(checkEnd);
        }
      };
      requestAnimationFrame(checkEnd);
    }
  }

  stopPreview() {
    if (this.interruptHowl) {
      this.interruptHowl.unload();
      this.interruptHowl = null;
    }
  }

  // Called when Reels mount or preview starts
  interrupt() {
    this.wasPlayingBeforeInterrupt = this.isPlaying;
    this.pause();
  }

  // Called when Reels unmount or preview ends
  resumeAfterInterrupt() {
    this.stopPreview();
    if (this.wasPlayingBeforeInterrupt) {
      this.resume();
    }
    this.wasPlayingBeforeInterrupt = false;
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

export const audioManager = new AudioManager();
