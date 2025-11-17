// bpmDetector.js
// Advanced BPM detection using beat analysis algorithm
// Based on frequency domain analysis and onset detection

/**
 * Detect BPM from audio buffer using onset detection
 * @param {AudioBuffer} audioBuffer - Decoded audio data
 * @param {number} sampleRate - Audio sample rate
 * @returns {Promise<number>} Detected BPM
 */
export async function detectBPM(audioBuffer, sampleRate) {
  // Get mono channel data
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = 44100; // Analyze 1-second blocks at 44.1kHz
  const blocks = [];

  // Split into blocks and calculate energy
  for (let i = 0; i < channelData.length; i += blockSize) {
    const block = channelData.slice(i, i + blockSize);
    const energy = calculateEnergy(block);
    blocks.push(energy);
  }

  // Find peaks (onsets) in energy
  const peaks = findPeaks(blocks);

  // Calculate intervals between peaks
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }

  if (intervals.length === 0) {
    return 120; // Default BPM if detection fails
  }

  // Find most common interval (mode)
  const intervalCounts = new Map();
  intervals.forEach(interval => {
    const rounded = Math.round(interval);
    intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1);
  });

  let maxCount = 0;
  let mostCommonInterval = 0;
  intervalCounts.forEach((count, interval) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonInterval = interval;
    }
  });

  // Convert interval (in blocks) to BPM
  // Each block is 1 second at 44.1kHz sample rate
  const secondsPerBeat = mostCommonInterval;
  let bpm = 60 / secondsPerBeat;

  // Normalize BPM to typical range (60-200)
  while (bpm < 60) bpm *= 2;
  while (bpm > 200) bpm /= 2;

  return Math.round(bpm);
}

/**
 * Calculate energy of an audio block
 */
function calculateEnergy(block) {
  let sum = 0;
  for (let i = 0; i < block.length; i++) {
    sum += block[i] * block[i];
  }
  return sum / block.length;
}

/**
 * Find peaks in energy array (onset detection)
 */
function findPeaks(energyBlocks, threshold = 0.7) {
  const peaks = [];
  const maxEnergy = Math.max(...energyBlocks);
  const minThreshold = maxEnergy * threshold;

  for (let i = 1; i < energyBlocks.length - 1; i++) {
    // Peak if higher than neighbors and above threshold
    if (energyBlocks[i] > energyBlocks[i - 1] &&
        energyBlocks[i] > energyBlocks[i + 1] &&
        energyBlocks[i] > minThreshold) {
      peaks.push(i);
    }
  }

  return peaks;
}

/**
 * Real-time BPM detection from analyser node
 * Uses autocorrelation for live audio
 */
export class RealtimeBPMDetector {
  constructor(analyser) {
    this.analyser = analyser;
    this.bufferSize = 4096;
    this.sampleRate = analyser.context.sampleRate;
    this.peaks = [];
    this.detectedBPM = 0;
    this.confidence = 0;
  }

  /**
   * Analyze current audio and update BPM
   */
  analyze() {
    const buffer = new Float32Array(this.bufferSize);
    this.analyser.getFloatTimeDomainData(buffer);

    // Calculate autocorrelation
    const bpm = this._autocorrelation(buffer);

    if (bpm > 0) {
      this.detectedBPM = bpm;
      this.confidence = 0.8; // Simplified confidence
    }

    return {
      bpm: this.detectedBPM,
      confidence: this.confidence
    };
  }

  /**
   * Autocorrelation-based BPM detection
   */
  _autocorrelation(buffer) {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    const correlations = new Float32Array(MAX_SAMPLES);

    // Calculate autocorrelation
    for (let lag = 0; lag < MAX_SAMPLES; lag++) {
      let sum = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        sum += buffer[i] * buffer[i + lag];
      }
      correlations[lag] = sum;
    }

    // Find peaks in autocorrelation
    const peaks = [];
    for (let i = 1; i < correlations.length - 1; i++) {
      if (correlations[i] > correlations[i - 1] &&
          correlations[i] > correlations[i + 1]) {
        peaks.push({ index: i, value: correlations[i] });
      }
    }

    if (peaks.length < 2) return 0;

    // Sort by correlation strength
    peaks.sort((a, b) => b.value - a.value);

    // Convert best peak to BPM
    const samplesPerBeat = peaks[0].index;
    const secondsPerBeat = samplesPerBeat / this.sampleRate;
    let bpm = 60 / secondsPerBeat;

    // Normalize to typical range
    while (bpm < 60) bpm *= 2;
    while (bpm > 200) bpm /= 2;

    return Math.round(bpm);
  }

  /**
   * Get current detected BPM
   */
  getBPM() {
    return this.detectedBPM;
  }

  /**
   * Get confidence level (0.0 - 1.0)
   */
  getConfidence() {
    return this.confidence;
  }

  /**
   * Reset detector
   */
  reset() {
    this.peaks = [];
    this.detectedBPM = 0;
    this.confidence = 0;
  }
}

/**
 * Beat Grid - maintains beat positions for beat matching
 */
export class BeatGrid {
  constructor(bpm, offset = 0) {
    this.bpm = bpm;
    this.offset = offset; // Offset in seconds to first beat
    this.beatsPerBar = 4;
  }

  /**
   * Get beat position at a given time
   */
  getBeatAt(timeSeconds) {
    const secondsPerBeat = 60 / this.bpm;
    const beatsSinceStart = (timeSeconds - this.offset) / secondsPerBeat;
    return beatsSinceStart;
  }

  /**
   * Get nearest beat time
   */
  getNearestBeatTime(timeSeconds) {
    const beat = Math.round(this.getBeatAt(timeSeconds));
    return this.offset + (beat * 60 / this.bpm);
  }

  /**
   * Get next beat time
   */
  getNextBeatTime(timeSeconds) {
    const beat = Math.ceil(this.getBeatAt(timeSeconds));
    return this.offset + (beat * 60 / this.bpm);
  }

  /**
   * Get previous beat time
   */
  getPreviousBeatTime(timeSeconds) {
    const beat = Math.floor(this.getBeatAt(timeSeconds));
    return this.offset + (beat * 60 / this.bpm);
  }

  /**
   * Check if time is on a beat (within tolerance)
   */
  isOnBeat(timeSeconds, toleranceMs = 50) {
    const nearestBeat = this.getNearestBeatTime(timeSeconds);
    const diffMs = Math.abs(timeSeconds - nearestBeat) * 1000;
    return diffMs <= toleranceMs;
  }

  /**
   * Get bar number at time
   */
  getBarAt(timeSeconds) {
    const beat = this.getBeatAt(timeSeconds);
    return Math.floor(beat / this.beatsPerBar);
  }

  /**
   * Adjust BPM (for beat matching)
   */
  setBPM(newBPM) {
    this.bpm = newBPM;
  }

  /**
   * Adjust offset (for phase alignment)
   */
  setOffset(offsetSeconds) {
    this.offset = offsetSeconds;
  }
}
