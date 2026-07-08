import { useSyncExternalStore } from 'react';
import { audioManager, type AudioState } from '../lib/audio';

export function useAudioPlayer(): AudioState {
  return useSyncExternalStore(
    (cb) => audioManager.subscribe(cb),
    () => audioManager.getState(),
    () => audioManager.getState()
  );
}
