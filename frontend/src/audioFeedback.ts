type SoundName = 'pack' | 'flip' | 'mythic';

const soundProfiles: Record<SoundName, { duration: number; endFrequency: number; startFrequency: number; type: OscillatorType; volume: number }> = {
  flip: { duration: 0.09, endFrequency: 320, startFrequency: 520, type: 'triangle', volume: 0.035 },
  mythic: { duration: 0.42, endFrequency: 880, startFrequency: 420, type: 'sine', volume: 0.055 },
  pack: { duration: 0.16, endFrequency: 90, startFrequency: 180, type: 'sawtooth', volume: 0.03 },
};

let audioContext: AudioContext | null = null;

export function playFeedbackSound(soundName: SoundName, isEnabled: boolean) {
  if (!isEnabled) {
    return;
  }

  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }

  audioContext ??= new AudioContextConstructor();
  const profile = soundProfiles[soundName];
  const startedAt = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = profile.type;
  oscillator.frequency.setValueAtTime(profile.startFrequency, startedAt);
  oscillator.frequency.exponentialRampToValueAtTime(profile.endFrequency, startedAt + profile.duration);
  gain.gain.setValueAtTime(profile.volume, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + profile.duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + profile.duration);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
