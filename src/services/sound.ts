/** Short beep at the end of a rest. Failures are silent: sound is a nicety, never a blocker. */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

let player: AudioPlayer | null = null;

export function playRestEnd(): void {
  try {
    player ??= createAudioPlayer(require('../../assets/sounds/rest-end.wav'));
    player.seekTo(0).catch(() => undefined);
    player.play();
  } catch {
    // Audio unavailable (e.g. autoplay blocked on web): ignore.
  }
}
