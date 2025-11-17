// recommendations.js
// AI-powered song recommendation engine for DJ mixing
// Analyzes BPM, key, energy, and vibe to suggest compatible tracks

import { getAudioFeatures, getBulkAudioFeatures, getRecommendations } from '../integrations/spotify/api.js';
import { config } from '../../config.js';

/**
 * AI Recommendation Engine
 * Suggests next tracks based on current track's characteristics
 */
export class AIRecommendationEngine {
  constructor() {
    this.weights = config.ai.matchingFactors;
    this.bpmTolerance = config.ai.bpmTolerance;
    this.cache = new Map(); // Cache recommendations
  }

  /**
   * Get track recommendations based on current track
   * @param {Object} currentTrack - Currently playing track
   * @param {Array} availableTracks - Pool of tracks to recommend from
   * @param {number} limit - Max recommendations
   * @returns {Promise<Array>} Recommended tracks with match scores
   */
  async getRecommendations(currentTrack, availableTracks = [], limit = 10) {
    // Get audio features for current track
    let currentFeatures;

    if (currentTrack.source === 'spotify') {
      currentFeatures = await getAudioFeatures(currentTrack.id);
    } else {
      // For local tracks, use detected features
      currentFeatures = {
        bpm: currentTrack.bpm,
        energy: currentTrack.energy || 0.5,
        key: currentTrack.key || 0,
        mode: currentTrack.mode || 1
      };
    }

    // Use Spotify recommendations if available
    const spotifyRecs = await this._getSpotifyRecommendations(currentFeatures, limit);

    // Combine with local track matching
    const localRecs = this._matchLocalTracks(currentFeatures, availableTracks);

    // Merge and rank all recommendations
    const allRecs = [...spotifyRecs, ...localRecs];
    const rankedRecs = this._rankRecommendations(currentFeatures, allRecs);

    return rankedRecs.slice(0, limit);
  }

  /**
   * Get Spotify-powered recommendations
   */
  async _getSpotifyRecommendations(features, limit) {
    try {
      const recs = await getRecommendations({
        seedTrackIds: [],
        targetBpm: features.bpm,
        targetEnergy: features.energy,
        targetDanceability: features.danceability,
        limit: limit
      });

      // Get audio features for recommended tracks
      const trackIds = recs.map(t => t.id);
      const bulkFeatures = await getBulkAudioFeatures(trackIds);

      return recs.map((track, i) => ({
        ...track,
        features: bulkFeatures[i],
        source: 'spotify'
      }));
    } catch (err) {
      console.warn('Spotify recommendations failed:', err);
      return [];
    }
  }

  /**
   * Match tracks from local library
   */
  _matchLocalTracks(currentFeatures, availableTracks) {
    return availableTracks
      .filter(track => track.source === 'local')
      .map(track => ({
        ...track,
        features: {
          bpm: track.bpm,
          energy: track.energy || 0.5,
          key: track.key || 0,
          mode: track.mode || 1
        }
      }));
  }

  /**
   * Rank recommendations by compatibility score
   */
  _rankRecommendations(currentFeatures, tracks) {
    const scored = tracks.map(track => {
      const score = this._calculateMatchScore(currentFeatures, track.features);
      return {
        ...track,
        matchScore: score,
        matchPercent: Math.round(score * 100),
        reasons: this._getMatchReasons(currentFeatures, track.features)
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored;
  }

  /**
   * Calculate compatibility score (0.0 - 1.0)
   */
  _calculateMatchScore(current, candidate) {
    // BPM score (within tolerance = perfect)
    const bpmDiff = Math.abs(current.bpm - candidate.bpm);
    const bpmScore = Math.max(0, 1 - (bpmDiff / this.bpmTolerance));

    // Energy score (0-1 scale)
    const energyDiff = Math.abs(current.energy - candidate.energy);
    const energyScore = 1 - energyDiff;

    // Key compatibility (harmonic mixing)
    const keyScore = this._calculateKeyCompatibility(
      current.key,
      current.mode,
      candidate.key,
      candidate.mode
    );

    // Weighted sum
    const score =
      (bpmScore * this.weights.bpm) +
      (energyScore * this.weights.energy) +
      (keyScore * this.weights.key);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate harmonic key compatibility (Camelot wheel)
   */
  _calculateKeyCompatibility(key1, mode1, key2, mode2) {
    // Convert to Camelot wheel positions
    const camelot1 = this._toCamelot(key1, mode1);
    const camelot2 = this._toCamelot(key2, mode2);

    // Calculate distance on Camelot wheel
    const distance = Math.min(
      Math.abs(camelot1 - camelot2),
      12 - Math.abs(camelot1 - camelot2)
    );

    // Perfect match (same key) = 1.0
    // Adjacent keys = 0.8
    // Relative major/minor = 0.9
    if (distance === 0) return 1.0;
    if (distance === 1) return 0.8;
    if (distance === 2) return 0.6;
    return 0.3;
  }

  /**
   * Convert musical key to Camelot wheel position
   */
  _toCamelot(key, mode) {
    // Simplified Camelot wheel mapping
    const majorKeys = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // C, G, D, A, E, B, F#, C#, Ab, Eb, Bb, F
    const minorKeys = [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2]; // Am, Em, Bm, F#m, C#m, G#m, Ebm, Bbm, Fm, Cm, Gm, Dm

    const wheel = mode === 1 ? majorKeys : minorKeys;
    return wheel.indexOf(key);
  }

  /**
   * Get human-readable match reasons
   */
  _getMatchReasons(current, candidate) {
    const reasons = [];

    // BPM match
    const bpmDiff = Math.abs(current.bpm - candidate.bpm);
    if (bpmDiff === 0) {
      reasons.push('Perfect BPM match');
    } else if (bpmDiff <= this.bpmTolerance) {
      reasons.push(`Similar BPM (±${bpmDiff})`);
    }

    // Energy match
    const energyDiff = Math.abs(current.energy - candidate.energy);
    if (energyDiff < 0.1) {
      reasons.push('Matching energy level');
    } else if (current.energy < candidate.energy) {
      reasons.push('Builds energy');
    } else {
      reasons.push('Lowers energy');
    }

    // Key compatibility
    if (current.key === candidate.key && current.mode === candidate.mode) {
      reasons.push('Same key');
    } else {
      const keyScore = this._calculateKeyCompatibility(
        current.key,
        current.mode,
        candidate.key,
        candidate.mode
      );
      if (keyScore >= 0.8) {
        reasons.push('Harmonic key match');
      }
    }

    return reasons;
  }

  /**
   * Get "vibe-based" recommendations using natural language
   * @param {string} vibe - Description like "energetic", "chill", "dark", etc.
   * @param {Object} currentTrack - Current track for context
   * @returns {Promise<Array>} Recommended tracks
   */
  async getVibeRecommendations(vibe, currentTrack = null) {
    const vibeMap = {
      'energetic': { energy: 0.8, valence: 0.7, tempo: 128 },
      'chill': { energy: 0.3, valence: 0.5, tempo: 90 },
      'dark': { energy: 0.6, valence: 0.2, tempo: 120 },
      'uplifting': { energy: 0.7, valence: 0.9, tempo: 125 },
      'aggressive': { energy: 0.9, valence: 0.3, tempo: 140 },
      'smooth': { energy: 0.4, valence: 0.6, tempo: 100 },
      'party': { energy: 0.9, valence: 0.8, tempo: 130 }
    };

    const vibeParams = vibeMap[vibe.toLowerCase()] || { energy: 0.5, valence: 0.5, tempo: 120 };

    try {
      return await getRecommendations({
        seedTrackIds: currentTrack ? [currentTrack.id] : [],
        targetBpm: vibeParams.tempo,
        targetEnergy: vibeParams.energy,
        limit: 10
      });
    } catch (err) {
      console.error('Vibe recommendations failed:', err);
      return [];
    }
  }

  /**
   * Analyze mixing transition quality
   * @param {Object} fromTrack - Track transitioning from
   * @param {Object} toTrack - Track transitioning to
   * @returns {Object} Transition analysis
   */
  analyzeTransition(fromTrack, toTrack) {
    const score = this._calculateMatchScore(fromTrack.features, toTrack.features);

    let quality = 'Poor';
    if (score >= 0.8) quality = 'Excellent';
    else if (score >= 0.6) quality = 'Good';
    else if (score >= 0.4) quality = 'Fair';

    return {
      score: score,
      percent: Math.round(score * 100),
      quality: quality,
      reasons: this._getMatchReasons(fromTrack.features, toTrack.features),
      suggestions: this._getTransitionSuggestions(fromTrack.features, toTrack.features)
    };
  }

  /**
   * Get suggestions for improving transition
   */
  _getTransitionSuggestions(from, to) {
    const suggestions = [];

    const bpmDiff = Math.abs(from.bpm - to.bpm);
    if (bpmDiff > this.bpmTolerance) {
      suggestions.push('Use beat matching to sync BPM');
    }

    const energyDiff = to.energy - from.energy;
    if (energyDiff > 0.3) {
      suggestions.push('Consider a bridge track for smoother energy transition');
    } else if (energyDiff < -0.3) {
      suggestions.push('Energy drop - good for breakdown moment');
    }

    const keyScore = this._calculateKeyCompatibility(from.key, from.mode, to.key, to.mode);
    if (keyScore < 0.5) {
      suggestions.push('Keys clash - use EQ cuts during transition');
    }

    return suggestions;
  }
}

/**
 * Playlist Generator - Creates DJ sets automatically
 */
export class PlaylistGenerator {
  constructor(recommendationEngine) {
    this.engine = recommendationEngine;
  }

  /**
   * Generate a full DJ set playlist
   * @param {Object} startTrack - Opening track
   * @param {number} duration - Target duration in minutes
   * @param {string} journey - 'buildup', 'plateau', 'cooldown'
   * @returns {Promise<Array>} Generated playlist
   */
  async generateSet(startTrack, duration, journey = 'buildup') {
    const playlist = [startTrack];
    let currentTrack = startTrack;
    let totalDuration = startTrack.duration / 60000; // Convert to minutes

    while (totalDuration < duration) {
      // Get recommendations for next track
      const recs = await this.engine.getRecommendations(currentTrack);

      if (recs.length === 0) break;

      // Select based on journey type
      let nextTrack;
      switch (journey) {
        case 'buildup':
          // Gradually increase energy
          nextTrack = this._selectEnergyBuildup(recs, currentTrack);
          break;
        case 'plateau':
          // Maintain similar energy
          nextTrack = this._selectSimilarEnergy(recs, currentTrack);
          break;
        case 'cooldown':
          // Gradually decrease energy
          nextTrack = this._selectEnergyCooldown(recs, currentTrack);
          break;
        default:
          nextTrack = recs[0];
      }

      playlist.push(nextTrack);
      currentTrack = nextTrack;
      totalDuration += nextTrack.duration / 60000;
    }

    return playlist;
  }

  _selectEnergyBuildup(recs, currentTrack) {
    return recs.find(t => t.features.energy > currentTrack.features?.energy) || recs[0];
  }

  _selectSimilarEnergy(recs, currentTrack) {
    return recs[0]; // Already sorted by match score
  }

  _selectEnergyCooldown(recs, currentTrack) {
    return recs.find(t => t.features.energy < currentTrack.features?.energy) || recs[0];
  }
}
