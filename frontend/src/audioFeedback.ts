type SoundName = 'pack' | 'flip' | 'mythic';

let audioContext: AudioContext | null = null;
let musicIntervalId: number | null = null;
let musicGain: GainNode | null = null;

export function playFeedbackSound(soundName: SoundName, isEnabled: boolean, audioVolume = 0.7) {
  if (!isEnabled) {
    return;
  }

  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }

  audioContext ??= new AudioContextConstructor();
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  if (soundName === 'pack') {
    playPackCrack(audioContext, audioVolume);
    return;
  }

  if (soundName === 'mythic') {
    playMythicSparkle(audioContext, audioVolume);
    return;
  }

  playCardFlip(audioContext, audioVolume);
}

export function syncBackgroundMusic(isEnabled: boolean, audioVolume = 0.7) {
  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
  if (!isEnabled || !AudioContextConstructor) {
    stopBackgroundMusic();
    return;
  }

  audioContext ??= new AudioContextConstructor();
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  if (musicIntervalId !== null) {
    updateMusicVolume(audioVolume);
    return;
  }

  musicGain = audioContext.createGain();
  musicGain.gain.setValueAtTime(musicVolume(audioVolume), audioContext.currentTime);
  musicGain.connect(audioContext.destination);
  playAmbientChord(audioContext);
  musicIntervalId = window.setInterval(() => {
    if (audioContext) {
      playAmbientChord(audioContext);
    }
  }, 2800);
}

function playCardFlip(context: AudioContext, audioVolume: number) {
  const startedAt = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(620, startedAt);
  oscillator.frequency.exponentialRampToValueAtTime(240, startedAt + 0.08);
  gain.gain.setValueAtTime(0.04 * normalizedVolume(audioVolume), startedAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.08);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + 0.08);
}

function playPackCrack(context: AudioContext, audioVolume: number) {
  const startedAt = context.currentTime;
  const noise = context.createBufferSource();
  const noiseGain = context.createGain();
  const filter = context.createBiquadFilter();
  const buffer = context.createBuffer(1, context.sampleRate * 0.18, context.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let index = 0; index < samples.length; index++) {
    samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
  }

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1450, startedAt);
  filter.Q.setValueAtTime(2.4, startedAt);
  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(0.08 * normalizedVolume(audioVolume), startedAt);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.18);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(context.destination);
  noise.start(startedAt);

  playTone(context, startedAt, 115, 74, 0.13, 'sawtooth', 0.025 * normalizedVolume(audioVolume));
}

function playMythicSparkle(context: AudioContext, audioVolume: number) {
  const startedAt = context.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

  notes.forEach((frequency, index) => {
    playTone(
      context,
      startedAt + index * 0.045,
      frequency,
      frequency * 1.08,
      0.34,
      'sine',
      (0.038 - index * 0.004) * normalizedVolume(audioVolume),
    );
  });
}

function playTone(
  context: AudioContext,
  startedAt: number,
  startFrequency: number,
  endFrequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(startFrequency, startedAt);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 0.0001), startedAt + duration);
  gain.gain.setValueAtTime(volume, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + duration);
}

function stopBackgroundMusic() {
  if (musicIntervalId !== null) {
    window.clearInterval(musicIntervalId);
    musicIntervalId = null;
  }

  if (musicGain) {
    const stoppedAt = audioContext?.currentTime ?? 0;
    musicGain.gain.setTargetAtTime(0.0001, stoppedAt, 0.08);
    window.setTimeout(() => {
      musicGain?.disconnect();
      musicGain = null;
    }, 180);
  }
}

function updateMusicVolume(audioVolume: number) {
  if (musicGain && audioContext) {
    musicGain.gain.setTargetAtTime(musicVolume(audioVolume), audioContext.currentTime, 0.08);
  }
}

function musicVolume(audioVolume: number): number {
  return 0.018 * normalizedVolume(audioVolume);
}

function normalizedVolume(audioVolume: number): number {
  return Math.min(Math.max(audioVolume, 0), 1);
}

function playAmbientChord(context: AudioContext) {
  if (!musicGain) {
    return;
  }

  const destination = musicGain;
  const startedAt = context.currentTime;
  const chord = [196, 246.94, 329.63];
  chord.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startedAt);
    gain.gain.setValueAtTime(0.0001, startedAt);
    gain.gain.linearRampToValueAtTime(0.12 - index * 0.02, startedAt + 0.45);
    gain.gain.setTargetAtTime(0.0001, startedAt + 1.8, 0.45);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(startedAt);
    oscillator.stop(startedAt + 3.1);
  });
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
