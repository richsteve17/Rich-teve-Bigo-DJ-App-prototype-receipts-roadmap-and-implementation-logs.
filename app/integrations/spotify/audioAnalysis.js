// audioAnalysis.js
// Fetch and process Spotify Audio Analysis API data for visualization
// Workaround for Web Playback SDK not exposing audio stream

import { getAccessToken } from './api.js';

/**
 * Spotify Audio Analysis Visualizer
 * Fetches analysis data and renders waveforms/visualizations
 */
export class SpotifyAudioAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.currentAnalysis = null;
  }

  /**
   * Fetch audio analysis for a track
   * @param {string} trackId - Spotify track ID
   * @returns {Promise<object>} Audio analysis data
   */
  async getAnalysis(trackId) {
    // Check cache first
    if (this.analysisCache.has(trackId)) {
      return this.analysisCache.get(trackId);
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No Spotify access token');
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Audio analysis fetch failed: ${response.status}`);
      }

      const analysis = await response.json();

      // Cache the analysis
      this.analysisCache.set(trackId, analysis);

      return analysis;
    } catch (err) {
      console.error('Error fetching audio analysis:', err);
      return null;
    }
  }

  /**
   * Generate waveform data from Spotify segments
   * @param {object} analysis - Spotify audio analysis object
   * @param {number} width - Canvas width
   * @returns {Uint8Array} Waveform data for rendering
   */
  generateWaveformData(analysis, width = 512) {
    if (!analysis || !analysis.segments) {
      return new Uint8Array(width);
    }

    const waveform = new Uint8Array(width);
    const segments = analysis.segments;
    const duration = analysis.track.duration;

    // Map segments to waveform bins
    for (let i = 0; i < width; i++) {
      const time = (i / width) * duration;

      // Find the segment at this time
      const segment = segments.find((s, idx) => {
        const nextSeg = segments[idx + 1];
        return s.start <= time && (!nextSeg || nextSeg.start > time);
      });

      if (segment) {
        // Use loudness as amplitude (range: typically -60 to 0 dB)
        // Normalize to 0-255
        const loudness = segment.loudness_max || segment.loudness_start;
        const normalized = Math.max(0, Math.min(255, (loudness + 60) * (255 / 60)));
        waveform[i] = normalized;
      }
    }

    return waveform;
  }

  /**
   * Get frequency data from Spotify timbre data
   * @param {object} segment - Spotify segment object
   * @returns {Uint8Array} Frequency data (12-dimensional timbre vector)
   */
  getFrequencyData(segment) {
    if (!segment || !segment.timbre) {
      return new Uint8Array(128).fill(128); // Mid-range default
    }

    // Spotify timbre is 12-dimensional, expand to typical FFT size
    const freqData = new Uint8Array(128);
    const timbre = segment.timbre; // 12 values

    // Map 12 timbre values across 128 frequency bins
    for (let i = 0; i < freqData.length; i++) {
      const timbreIdx = Math.floor((i / freqData.length) * timbre.length);
      const value = timbre[timbreIdx];
      // Normalize timbre (typically -100 to +100) to 0-255
      freqData[i] = Math.max(0, Math.min(255, (value + 100) * (255 / 200)));
    }

    return freqData;
  }

  /**
   * Get current segment at playback position
   * @param {object} analysis - Audio analysis data
   * @param {number} currentTime - Current playback time in seconds
   * @returns {object} Current segment
   */
  getCurrentSegment(analysis, currentTime) {
    if (!analysis || !analysis.segments) {
      return null;
    }

    const segments = analysis.segments;
    return segments.find((s, idx) => {
      const nextSeg = segments[idx + 1];
      return s.start <= currentTime && (!nextSeg || nextSeg.start > currentTime);
    });
  }

  /**
   * Get beat markers for visualization
   * @param {object} analysis - Audio analysis data
   * @returns {Array<number>} Beat timestamps in seconds
   */
  getBeatMarkers(analysis) {
    if (!analysis || !analysis.beats) {
      return [];
    }

    return analysis.beats.map(beat => beat.start);
  }

  /**
   * Get bar markers for visualization
   * @param {object} analysis - Audio analysis data
   * @returns {Array<number>} Bar timestamps in seconds
   */
  getBarMarkers(analysis) {
    if (!analysis || !analysis.bars) {
      return [];
    }

    return analysis.bars.map(bar => bar.start);
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
  }

  /**
   * Pre-load analysis for a track (for smoother UX)
   * @param {string} trackId - Spotify track ID
   */
  async preloadAnalysis(trackId) {
    // Fire and forget - don't wait for result
    this.getAnalysis(trackId).catch(err => {
      console.warn('Failed to preload analysis:', err);
    });
  }
}

// Export singleton instance
export const spotifyAnalyzer = new SpotifyAudioAnalyzer();
