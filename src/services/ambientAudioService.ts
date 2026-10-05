// Procedural Web Audio API Soundscape Generator (Self-Contained, Zero External Assets)

class AmbientAudioService {
  private audioCtx: AudioContext | null = null;
  private currentSourceNodes: AudioNode[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentType: 'none' | 'rain' | 'whitenoise' | 'cafesound' = 'none';

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setSound(type: 'none' | 'rain' | 'whitenoise' | 'cafesound', volume: number = 0.5) {
    if (type === this.currentType && this.isPlaying) {
      this.setVolume(volume);
      return;
    }

    this.stop();
    this.currentType = type;

    if (type === 'none') return;

    this.initContext();
    if (!this.audioCtx) return;

    // Master Gain
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume * 0.4)), this.audioCtx.currentTime);
    this.gainNode.connect(this.audioCtx.destination);

    if (type === 'whitenoise') {
      this.playWhiteNoise();
    } else if (type === 'rain') {
      this.playRainSound();
    } else if (type === 'cafesound') {
      this.playCafeAtmosphere();
    }

    this.isPlaying = true;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume * 0.4)), this.audioCtx.currentTime);
    }
  }

  public stop() {
    this.currentSourceNodes.forEach(node => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch (e) {
        // ignore disconnect errors
      }
    });
    this.currentSourceNodes = [];
    this.isPlaying = false;
    this.currentType = 'none';
  }

  private playWhiteNoise() {
    if (!this.audioCtx || !this.gainNode) return;
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Low-pass filter to make it pleasant pink/brown noise
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();

    this.currentSourceNodes.push(whiteNoise, filter);
  }

  private playRainSound() {
    if (!this.audioCtx || !this.gainNode) return;
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const rainSource = this.audioCtx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    // Bandpass + lowpass for rainfall frequencies
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
    filter.Q.setValueAtTime(1.2, this.audioCtx.currentTime);

    rainSource.connect(filter);
    filter.connect(this.gainNode);
    rainSource.start();

    this.currentSourceNodes.push(rainSource, filter);
  }

  private playCafeAtmosphere() {
    if (!this.audioCtx || !this.gainNode) return;
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const cafeSource = this.audioCtx.createBufferSource();
    cafeSource.buffer = noiseBuffer;
    cafeSource.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);

    cafeSource.connect(filter);
    filter.connect(this.gainNode);
    cafeSource.start();

    this.currentSourceNodes.push(cafeSource, filter);
  }
}

export const ambientAudio = new AmbientAudioService();
