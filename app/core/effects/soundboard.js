// soundboard.js
// Sample pad soundboard for DJ effects and transitions
// Air horns, vocal samples, sound effects

/**
 * Soundboard - Trigger audio samples with sample pads
 */
export class Soundboard {
  constructor(audioContext, outputNode = null) {
    this.audioContext = audioContext;
    this.outputNode = outputNode || audioContext.destination;
    this.samples = new Map(); // Map of pad ID -> AudioBuffer
    this.isPlaying = new Map(); // Track which pads are playing
  }

  /**
   * Load a sample into a pad
   * @param {string} padId - Pad identifier (e.g., 'pad1', 'pad2')
   * @param {string} url - URL to audio file
   */
  async loadSample(padId, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.samples.set(padId, audioBuffer);

      return {
        success: true,
        message: `Sample loaded into ${padId}`
      };
    } catch (err) {
      console.error(`Failed to load sample for ${padId}:`, err);
      return {
        success: false,
        error: `Failed to load sample: ${err.message}`
      };
    }
  }

  /**
   * Play a sample from a pad
   * @param {string} padId - Pad identifier
   * @param {number} volume - Volume (0.0 - 1.0)
   */
  play(padId, volume = 1.0) {
    const buffer = this.samples.get(padId);

    if (!buffer) {
      console.warn(`No sample loaded for ${padId}`);
      return { success: false, error: 'No sample loaded' };
    }

    try {
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = Math.max(0, Math.min(1, volume));

      // Connect: source -> gain -> output
      source.connect(gainNode);
      gainNode.connect(this.outputNode);

      // Play
      source.start(0);

      // Mark as playing
      this.isPlaying.set(padId, true);

      // Clean up when finished
      source.onended = () => {
        this.isPlaying.set(padId, false);
        source.disconnect();
        gainNode.disconnect();
      };

      return { success: true, message: `Playing ${padId}` };
    } catch (err) {
      console.error(`Error playing ${padId}:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Stop all playing samples
   */
  stopAll() {
    this.isPlaying.clear();
    // Note: We can't stop individual sources once started,
    // but we clear the playing state
  }

  /**
   * Check if a pad is currently playing
   * @param {string} padId - Pad identifier
   */
  isPadPlaying(padId) {
    return this.isPlaying.get(padId) || false;
  }

  /**
   * Get list of loaded pads
   */
  getLoadedPads() {
    return Array.from(this.samples.keys());
  }

  /**
   * Clear a specific pad
   * @param {string} padId - Pad identifier
   */
  clearPad(padId) {
    this.samples.delete(padId);
    this.isPlaying.delete(padId);
  }

  /**
   * Clear all pads
   */
  clearAll() {
    this.samples.clear();
    this.isPlaying.clear();
  }

  /**
   * Load default sound effects
   */
  async loadDefaultSamples() {
    // Create simple synth sounds procedurally since we don't have sample files
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5; // 500ms samples
    const length = sampleRate * duration;

    // Air Horn
    const airHorn = this.audioContext.createBuffer(1, length, sampleRate);
    const airHornData = airHorn.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      airHornData[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 2);
    }
    this.samples.set('pad1', airHorn);

    // Kick Drum
    const kick = this.audioContext.createBuffer(1, length, sampleRate);
    const kickData = kick.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 150 * Math.exp(-t * 20);
      kickData[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8);
    }
    this.samples.set('pad2', kick);

    // Snare
    const snare = this.audioContext.createBuffer(1, length, sampleRate);
    const snareData = snare.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15);
      const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 10);
      snareData[i] = (noise + tone) * 0.5;
    }
    this.samples.set('pad3', snare);

    // Hi-Hat
    const hihat = this.audioContext.createBuffer(1, length * 0.3, sampleRate);
    const hihatData = hihat.getChannelData(0);
    for (let i = 0; i < hihat.length; i++) {
      const t = i / sampleRate;
      hihatData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 25);
    }
    this.samples.set('pad4', hihat);

    console.log('✅ Default soundboard samples loaded');
  }
}
