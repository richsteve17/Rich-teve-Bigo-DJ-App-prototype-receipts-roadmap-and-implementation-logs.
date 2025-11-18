// tabCapture.js
// Tab audio capture for Spotify EQ workaround
// Captures this tab's audio and routes through Web Audio API for full processing

/**
 * Tab Audio Capture System
 * Workaround for Spotify Web Playback SDK DRM limitations
 *
 * How it works:
 * 1. Spotify plays normally (but muted)
 * 2. We capture THIS tab's audio via getDisplayMedia
 * 3. Route captured audio through Web Audio API with full EQ control
 * 4. User hears the EQ'd version with ~50-100ms latency
 */
export class TabAudioCapture {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.captureStream = null;
    this.sourceNode = null;
    this.isCapturing = false;
    this.outputNode = null;
  }

  /**
   * Start capturing current tab's audio
   * @param {AudioNode} outputNode - Where to route the captured audio
   * @returns {Promise<object>} Status object
   */
  async startCapture(outputNode) {
    if (this.isCapturing) {
      return { success: true, message: 'Already capturing' };
    }

    try {
      // Request tab audio capture
      // preferCurrentTab is Chrome-specific, helps avoid showing all tabs
      this.captureStream = await navigator.mediaDevices.getDisplayMedia({
        video: false, // We only want audio
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        },
        preferCurrentTab: true, // Chrome feature to default to current tab
        selfBrowserSurface: 'include', // Allow capturing own tab
        surfaceSwitching: 'exclude' // Don't allow switching surfaces
      });

      // Check if we got audio
      const audioTracks = this.captureStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio track in capture');
      }

      console.log('✅ Tab audio capture started:', audioTracks[0].getSettings());

      // Create Web Audio source from captured stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.captureStream);

      // Store output node
      this.outputNode = outputNode;

      // Connect to output (will be routed through EQ by caller)
      if (this.outputNode) {
        this.sourceNode.connect(this.outputNode);
      } else {
        this.sourceNode.connect(this.audioContext.destination);
      }

      this.isCapturing = true;

      // Listen for stream ending (user stops sharing)
      audioTracks[0].addEventListener('ended', () => {
        console.log('Tab capture ended by user');
        this.stopCapture();
      });

      return {
        success: true,
        message: 'Tab audio capture started',
        latency: this.estimateLatency()
      };

    } catch (err) {
      console.error('Tab capture error:', err);

      let message = 'Tab capture failed';
      if (err.name === 'NotAllowedError') {
        message = 'Permission denied. Please allow tab audio sharing.';
      } else if (err.name === 'NotSupportedError') {
        message = 'Tab audio capture not supported in this browser. Try Chrome or Edge.';
      } else if (err.message === 'No audio track in capture') {
        message = 'No audio track found. Make sure to check "Share audio" when selecting the tab.';
      }

      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Stop capturing tab audio
   */
  stopCapture() {
    if (this.captureStream) {
      this.captureStream.getTracks().forEach(track => track.stop());
      this.captureStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.outputNode = null;
    this.isCapturing = false;

    return {
      success: true,
      message: 'Tab capture stopped'
    };
  }

  /**
   * Check if tab capture is active
   */
  isActive() {
    return this.isCapturing;
  }

  /**
   * Estimate capture latency (typically 50-100ms)
   */
  estimateLatency() {
    // Browser audio capture typically adds 50-100ms latency
    // This is acceptable for DJ mixing (beatmatching allows for this)
    return {
      estimated: '50-100ms',
      note: 'Acceptable for DJ mixing, compensated by visual cues'
    };
  }

  /**
   * Get source node for routing through effects
   */
  getSourceNode() {
    return this.sourceNode;
  }

  /**
   * Reconnect to different output
   * @param {AudioNode} newOutput - New output node
   */
  reconnect(newOutput) {
    if (!this.sourceNode) {
      return { success: false, error: 'Not capturing' };
    }

    // Disconnect from current output
    this.sourceNode.disconnect();

    // Connect to new output
    this.outputNode = newOutput;
    if (this.outputNode) {
      this.sourceNode.connect(this.outputNode);
    } else {
      this.sourceNode.connect(this.audioContext.destination);
    }

    return { success: true };
  }
}

/**
 * Spotify Deck with Tab Capture for EQ
 * Wraps DJDeck with tab capture for full audio processing
 */
export class SpotifyDeckWithCapture {
  constructor(name, audioContext, spotifyDeck) {
    this.name = name;
    this.audioContext = audioContext;
    this.spotifyDeck = spotifyDeck; // Original Spotify deck
    this.tabCapture = new TabAudioCapture(audioContext);
    this.captureMode = false;

    // Create EQ chain for captured audio
    this.captureGain = audioContext.createGain();
    this.captureEqLow = audioContext.createBiquadFilter();
    this.captureEqMid = audioContext.createBiquadFilter();
    this.captureEqHigh = audioContext.createBiquadFilter();
    this.captureAnalyser = audioContext.createAnalyser();

    // Configure EQ filters
    this.captureEqLow.type = 'lowshelf';
    this.captureEqLow.frequency.value = 250;
    this.captureEqLow.gain.value = 0;

    this.captureEqMid.type = 'peaking';
    this.captureEqMid.frequency.value = 2500;
    this.captureEqMid.Q.value = 1.0;
    this.captureEqMid.gain.value = 0;

    this.captureEqHigh.type = 'highshelf';
    this.captureEqHigh.frequency.value = 10000;
    this.captureEqHigh.gain.value = 0;

    // Configure analyser
    this.captureAnalyser.fftSize = 2048;
    this.captureAnalyser.smoothingTimeConstant = 0.8;

    // Chain: capture source will connect to -> gain -> EQ -> analyser -> output
    this.captureGain.connect(this.captureEqLow);
    this.captureEqLow.connect(this.captureEqMid);
    this.captureEqMid.connect(this.captureEqHigh);
    this.captureEqHigh.connect(this.captureAnalyser);
    // Output connection will be set when enabling capture mode
  }

  /**
   * Enable tab capture mode for full EQ control
   * @param {AudioNode} outputNode - Where to route the audio
   */
  async enableCaptureMode(outputNode) {
    if (this.captureMode) {
      return { success: true, message: 'Capture mode already enabled' };
    }

    // Connect capture chain to output
    this.captureAnalyser.connect(outputNode);

    // Start tab capture
    const result = await this.tabCapture.startCapture(this.captureGain);

    if (result.success) {
      this.captureMode = true;

      // Mute the original Spotify player (we'll hear the captured version instead)
      await this.spotifyDeck.setVolume(0);

      console.log(`✅ ${this.name}: Capture mode enabled - EQ now functional`);

      return {
        success: true,
        message: 'EQ capture mode enabled',
        latency: result.latency
      };
    } else {
      // Failed to start capture, disconnect chain
      this.captureAnalyser.disconnect();
      return result;
    }
  }

  /**
   * Disable tab capture mode
   */
  async disableCaptureMode() {
    if (!this.captureMode) {
      return { success: true, message: 'Capture mode already disabled' };
    }

    // Stop capture
    this.tabCapture.stopCapture();

    // Disconnect capture chain
    this.captureAnalyser.disconnect();

    // Restore Spotify player volume
    await this.spotifyDeck.setVolume(0.8);

    this.captureMode = false;

    console.log(`${this.name}: Capture mode disabled`);

    return {
      success: true,
      message: 'Returned to standard mode'
    };
  }

  /**
   * Set EQ (works in capture mode, UI-only in normal mode)
   * @param {string} band - 'low', 'mid', or 'high'
   * @param {number} gain - -24 to +24 dB
   */
  setEQ(band, gain) {
    if (this.captureMode) {
      // REAL EQ processing on captured audio
      gain = Math.max(-24, Math.min(24, gain));
      switch(band) {
        case 'low':
          this.captureEqLow.gain.value = gain;
          break;
        case 'mid':
          this.captureEqMid.gain.value = gain;
          break;
        case 'high':
          this.captureEqHigh.gain.value = gain;
          break;
      }
    } else {
      // UI-only in standard mode (pass to Spotify deck for consistency)
      this.spotifyDeck.setEQ(band, gain);
    }
  }

  /**
   * Get frequency data (from captured audio in capture mode)
   */
  getFrequencyData() {
    if (this.captureMode) {
      const bufferLength = this.captureAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.captureAnalyser.getByteFrequencyData(dataArray);
      return dataArray;
    } else {
      // Fall back to Spotify's Audio Analysis API
      return this.spotifyDeck.getFrequencyData();
    }
  }

  /**
   * Get waveform data (from captured audio in capture mode)
   */
  getWaveformData() {
    if (this.captureMode) {
      const bufferLength = this.captureAnalyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      this.captureAnalyser.getByteTimeDomainData(dataArray);
      return dataArray;
    } else {
      // Fall back to Spotify's Audio Analysis API
      return this.spotifyDeck.getWaveformData();
    }
  }

  /**
   * Forward all other methods to underlying Spotify deck
   */
  async loadTrack(uri, bpm) {
    return await this.spotifyDeck.loadTrack(uri, bpm);
  }

  async togglePlay() {
    return await this.spotifyDeck.togglePlay();
  }

  async setVolume(volume) {
    if (this.captureMode) {
      // Control capture gain instead
      this.captureGain.gain.value = volume;
    } else {
      return await this.spotifyDeck.setVolume(volume);
    }
  }

  async setCrossfaderPosition(position) {
    return await this.spotifyDeck.setCrossfaderPosition(position);
  }

  async seek(timeSeconds) {
    return await this.spotifyDeck.seek(timeSeconds);
  }

  async getCurrentTime() {
    return await this.spotifyDeck.getCurrentTime();
  }

  get isPlaying() {
    return this.spotifyDeck.isPlaying;
  }

  get currentTrack() {
    return this.spotifyDeck.currentTrack;
  }

  get bpm() {
    return this.spotifyDeck.bpm;
  }
}
