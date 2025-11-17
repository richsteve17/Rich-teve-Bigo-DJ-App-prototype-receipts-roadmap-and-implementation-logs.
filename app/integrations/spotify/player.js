// player.js
// Spotify Web Playback SDK wrapper for DJ mixing
// Provides deck control, playback state, and audio node access

import { getValidToken } from '../../../config.js';

/**
 * Spotify Web Playback SDK Player wrapper
 */
export class SpotifyPlayer {
  constructor(name = 'BIGO DJ Player') {
    this.name = name;
    this.player = null;
    this.deviceId = null;
    this.isReady = false;
    this.currentTrack = null;
    this.listeners = new Map();
  }

  /**
   * Initialize the Spotify Web Playback SDK
   */
  async init() {
    return new Promise((resolve, reject) => {
      // Load Spotify SDK if not already loaded
      if (!window.Spotify) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.head.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
          this._createPlayer(resolve, reject);
        };
      } else {
        this._createPlayer(resolve, reject);
      }
    });
  }

  /**
   * Create the player instance
   */
  _createPlayer(resolve, reject) {
    const token = getValidToken();
    if (!token) {
      reject(new Error('No valid Spotify token'));
      return;
    }

    this.player = new window.Spotify.Player({
      name: this.name,
      getOAuthToken: cb => cb(token),
      volume: 1.0
    });

    // Error handling
    this.player.addListener('initialization_error', ({ message }) => {
      console.error('Initialization error:', message);
      reject(new Error(message));
    });

    this.player.addListener('authentication_error', ({ message }) => {
      console.error('Authentication error:', message);
      reject(new Error(message));
    });

    this.player.addListener('account_error', ({ message }) => {
      console.error('Account error:', message);
      reject(new Error(message));
    });

    this.player.addListener('playback_error', ({ message }) => {
      console.error('Playback error:', message);
    });

    // Ready event
    this.player.addListener('ready', ({ device_id }) => {
      console.log('Spotify player ready with device ID:', device_id);
      this.deviceId = device_id;
      this.isReady = true;
      resolve(device_id);
    });

    // Not ready
    this.player.addListener('not_ready', ({ device_id }) => {
      console.log('Spotify player not ready, device ID:', device_id);
      this.isReady = false;
    });

    // Player state changed
    this.player.addListener('player_state_changed', state => {
      if (!state) return;

      this.currentTrack = state.track_window.current_track;
      this._emit('state_change', {
        paused: state.paused,
        position: state.position,
        duration: state.duration,
        track: this.currentTrack
      });
    });

    // Connect to the player
    this.player.connect();
  }

  /**
   * Play a track by URI
   * @param {string} uri - Spotify track URI
   */
  async play(uri) {
    if (!this.isReady) {
      throw new Error('Player not ready');
    }

    const token = getValidToken();
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [uri]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to play track');
    }
  }

  /**
   * Resume playback
   */
  async resume() {
    if (this.player) {
      await this.player.resume();
    }
  }

  /**
   * Pause playback
   */
  async pause() {
    if (this.player) {
      await this.player.pause();
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlay() {
    if (this.player) {
      await this.player.togglePlay();
    }
  }

  /**
   * Seek to position (ms)
   */
  async seek(positionMs) {
    if (this.player) {
      await this.player.seek(positionMs);
    }
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  async setVolume(volume) {
    if (this.player) {
      await this.player.setVolume(volume);
    }
  }

  /**
   * Get current playback state
   */
  async getState() {
    if (this.player) {
      return await this.player.getCurrentState();
    }
    return null;
  }

  /**
   * Get current position in track (ms)
   */
  async getPosition() {
    const state = await this.getState();
    return state ? state.position : 0;
  }

  /**
   * Check if track is playing
   */
  async isPlaying() {
    const state = await this.getState();
    return state ? !state.paused : false;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.player) {
      this.player.disconnect();
      this.isReady = false;
      this.deviceId = null;
    }
  }

  /**
   * Event listener system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error('Event callback error:', e);
        }
      });
    }
  }
}

/**
 * DJ Deck - Combines Spotify player with local audio context for mixing
 */
export class DJDeck {
  constructor(name, audioContext) {
    this.name = name;
    this.audioContext = audioContext;
    this.spotifyPlayer = new SpotifyPlayer(name);

    // Audio nodes for mixing
    this.gainNode = audioContext.createGain();
    this.eqLow = audioContext.createBiquadFilter();
    this.eqMid = audioContext.createBiquadFilter();
    this.eqHigh = audioContext.createBiquadFilter();
    this.analyser = audioContext.createAnalyser();

    // Configure EQ filters
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 100;
    this.eqLow.gain.value = 0;

    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 1.0;
    this.eqMid.gain.value = 0;

    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 10000;
    this.eqHigh.gain.value = 0;

    // Configure analyser
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Chain audio nodes
    this.gainNode.connect(this.eqLow);
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.analyser);
    this.analyser.connect(audioContext.destination);

    this.currentTrack = null;
    this.bpm = 0;
    this.isPlaying = false;
  }

  /**
   * Initialize the deck
   */
  async init() {
    await this.spotifyPlayer.init();

    // Listen to playback state
    this.spotifyPlayer.on('state_change', state => {
      this.isPlaying = !state.paused;
      this.currentTrack = state.track;
    });
  }

  /**
   * Load and play a track
   */
  async loadTrack(uri, bpm = 0) {
    this.bpm = bpm;
    await this.spotifyPlayer.play(uri);
    this.currentTrack = { uri, bpm };
  }

  /**
   * Play/pause
   */
  async togglePlay() {
    await this.spotifyPlayer.togglePlay();
  }

  /**
   * Set deck volume (0.0 - 1.0)
   */
  setVolume(volume) {
    this.gainNode.gain.value = volume;
  }

  /**
   * Set EQ levels (-24 to +24 dB)
   */
  setEQ(band, gain) {
    gain = Math.max(-24, Math.min(24, gain));
    switch(band) {
      case 'low':
        this.eqLow.gain.value = gain;
        break;
      case 'mid':
        this.eqMid.gain.value = gain;
        break;
      case 'high':
        this.eqHigh.gain.value = gain;
        break;
    }
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Get waveform data
   */
  getWaveformData() {
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.spotifyPlayer.disconnect();
    this.gainNode.disconnect();
  }
}
