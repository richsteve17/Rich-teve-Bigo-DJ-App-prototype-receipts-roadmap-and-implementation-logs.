// localTracks.js
// Local music file upload and management system
// Handles native audio files alongside Spotify integration

import { detectBPM } from '../audio/bpmDetector.js';

/**
 * Local Track Library Manager
 */
export class LocalTrackLibrary {
  constructor() {
    this.tracks = new Map(); // trackId -> track data
    this.audioContext = null;
    this.loadFromStorage();
  }

  /**
   * Initialize with audio context
   */
  init(audioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Upload audio file(s)
   * @param {FileList|File} files - Audio files to upload
   * @returns {Promise<Array>} Uploaded track metadata
   */
  async uploadFiles(files) {
    const fileArray = files instanceof FileList ? Array.from(files) : [files];
    const uploadedTracks = [];

    for (const file of fileArray) {
      // Validate audio file
      if (!file.type.startsWith('audio/')) {
        console.warn(`Skipping non-audio file: ${file.name}`);
        continue;
      }

      try {
        const track = await this._processAudioFile(file);
        uploadedTracks.push(track);
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
      }
    }

    this.saveToStorage();
    return uploadedTracks;
  }

  /**
   * Process an audio file and extract metadata
   */
  async _processAudioFile(file) {
    const trackId = this._generateId();

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Decode audio for analysis
    let audioBuffer = null;
    let bpm = 0;
    let duration = 0;

    try {
      if (this.audioContext) {
        audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
        duration = audioBuffer.duration;

        // Detect BPM from audio buffer
        bpm = await detectBPM(audioBuffer, this.audioContext.sampleRate);
      }
    } catch (err) {
      console.warn('Could not analyze audio:', err);
    }

    // Create blob URL for playback
    const blob = new Blob([arrayBuffer], { type: file.type });
    const url = URL.createObjectURL(blob);

    // Extract metadata from filename
    const metadata = this._parseFilename(file.name);

    const track = {
      id: trackId,
      name: metadata.title,
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Local Upload',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      duration: duration * 1000, // Convert to ms
      bpm: bpm,
      url: url,
      source: 'local',
      uploadedAt: Date.now(),
      explicit: false,
      waveformData: null // Will be generated on-demand
    };

    this.tracks.set(trackId, track);
    return track;
  }

  /**
   * Parse filename to extract metadata
   * Supports formats like: "Artist - Title.mp3" or "Title.mp3"
   */
  _parseFilename(filename) {
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

    if (nameWithoutExt.includes(' - ')) {
      const [artist, title] = nameWithoutExt.split(' - ').map(s => s.trim());
      return { artist, title };
    }

    return { title: nameWithoutExt, artist: null };
  }

  /**
   * Generate unique track ID
   */
  _generateId() {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get track by ID
   */
  getTrack(trackId) {
    return this.tracks.get(trackId);
  }

  /**
   * Get all tracks
   */
  getAllTracks() {
    return Array.from(this.tracks.values());
  }

  /**
   * Search local tracks
   */
  searchTracks(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllTracks().filter(track =>
      track.name.toLowerCase().includes(lowerQuery) ||
      track.artist.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Delete track
   */
  deleteTrack(trackId) {
    const track = this.tracks.get(trackId);
    if (track) {
      // Revoke blob URL to free memory
      URL.revokeObjectURL(track.url);
      this.tracks.delete(trackId);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Save library to localStorage (metadata only, not audio data)
   */
  saveToStorage() {
    const metadata = this.getAllTracks().map(track => ({
      ...track,
      url: null, // Don't store blob URLs
      waveformData: null // Don't store waveform data
    }));

    localStorage.setItem('local_track_library', JSON.stringify(metadata));
  }

  /**
   * Load library metadata from localStorage
   * Note: Actual audio files need to be re-uploaded after page reload
   */
  loadFromStorage() {
    const stored = localStorage.getItem('local_track_library');
    if (stored) {
      try {
        const metadata = JSON.parse(stored);
        // Note: This only loads metadata. Actual audio files are lost on reload.
        // In a real app, you'd store files in IndexedDB or similar.
        console.log(`Found ${metadata.length} local tracks in storage (audio files need re-upload)`);
      } catch (err) {
        console.error('Failed to load local library:', err);
      }
    }
  }

  /**
   * Clear all local tracks
   */
  clear() {
    this.getAllTracks().forEach(track => {
      if (track.url) {
        URL.revokeObjectURL(track.url);
      }
    });
    this.tracks.clear();
    localStorage.removeItem('local_track_library');
  }

  /**
   * Get library stats
   */
  getStats() {
    const tracks = this.getAllTracks();
    const totalSize = tracks.reduce((sum, t) => sum + t.fileSize, 0);
    const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);

    return {
      trackCount: tracks.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalDurationMs: totalDuration,
      totalDurationMin: (totalDuration / 60000).toFixed(1),
      avgBPM: tracks.length > 0
        ? Math.round(tracks.reduce((sum, t) => sum + t.bpm, 0) / tracks.length)
        : 0
    };
  }
}

/**
 * Local Track Player - plays native audio files
 */
export class LocalTrackPlayer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.audioElement = null;
    this.sourceNode = null;
    this.gainNode = audioContext.createGain();
    this.analyser = audioContext.createAnalyser();

    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode.connect(this.analyser);
    this.analyser.connect(audioContext.destination);

    this.currentTrack = null;
    this.isPlaying = false;
  }

  /**
   * Load and play a local track
   */
  async loadTrack(track) {
    // Stop current track
    this.stop();

    // Create new audio element
    this.audioElement = new Audio(track.url);
    this.audioElement.crossOrigin = 'anonymous';

    // Create media element source
    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
    this.sourceNode.connect(this.gainNode);

    this.currentTrack = track;

    return new Promise((resolve, reject) => {
      this.audioElement.addEventListener('canplaythrough', () => resolve(), { once: true });
      this.audioElement.addEventListener('error', reject, { once: true });
      this.audioElement.load();
    });
  }

  /**
   * Play the loaded track
   */
  async play() {
    if (this.audioElement) {
      await this.audioElement.play();
      this.isPlaying = true;
    }
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Stop playback and unload
   */
  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.currentTrack = null;
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to position (seconds)
   */
  seek(timeSeconds) {
    if (this.audioElement) {
      this.audioElement.currentTime = timeSeconds;
    }
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(volume) {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current position (seconds)
   */
  getCurrentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  /**
   * Get duration (seconds)
   */
  getDuration() {
    return this.audioElement ? this.audioElement.duration : 0;
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
}
