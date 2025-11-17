// contentFilter.js
// Streamer-safe music content filtering and DMCA risk assessment
// Helps streamers avoid copyright strikes and explicit content issues

import { config } from '../../../config.js';

/**
 * Content Safety Filter for streaming platforms
 */
export class ContentFilter {
  constructor() {
    this.settings = config.contentFilter;
    this.dmcaSafeArtists = new Set([
      // Common royalty-free/streaming-safe artists
      'Pretzel Rocks',
      'StreamBeats',
      'Harris Heller',
      'Chillhop Music',
      'Lofi Girl'
    ]);

    this.flaggedLabels = new Set([
      'Universal Music Group',
      'Sony Music Entertainment',
      'Warner Music Group',
      'Atlantic Records',
      'Columbia Records',
      'RCA Records',
      'Interscope Records'
    ]);
  }

  /**
   * Check if track is safe for streaming
   * @param {Object} track - Track to analyze
   * @returns {Object} Safety assessment
   */
  assessTrack(track) {
    const risks = [];
    const warnings = [];
    let safetyScore = 1.0;

    // Check for explicit content
    if (track.explicit && !this.settings.explicitContent) {
      risks.push('Explicit content flagged');
      safetyScore -= 0.3;
    }

    // Check copyright risk
    const copyrightRisk = this._assessCopyrightRisk(track);
    if (copyrightRisk.level === 'high') {
      risks.push('High DMCA risk - major label release');
      safetyScore -= 0.5;
    } else if (copyrightRisk.level === 'medium') {
      warnings.push('Medium DMCA risk - verify licensing');
      safetyScore -= 0.2;
    }

    // Check if artist is streaming-safe
    if (this.isStreamerSafe(track.artist)) {
      safetyScore = Math.min(1.0, safetyScore + 0.2);
      warnings.push('Verified streamer-safe artist');
    }

    // Check popularity (very popular songs = higher DMCA risk)
    if (track.popularity > 80) {
      warnings.push('High popularity may increase DMCA detection');
      safetyScore -= 0.1;
    }

    // Overall assessment
    let status = 'safe';
    if (safetyScore < 0.3) status = 'blocked';
    else if (safetyScore < 0.6) status = 'risky';
    else if (safetyScore < 0.8) status = 'caution';

    return {
      status: status,
      safetyScore: Math.max(0, safetyScore),
      safetyPercent: Math.round(Math.max(0, safetyScore) * 100),
      risks: risks,
      warnings: warnings,
      copyrightRisk: copyrightRisk.level,
      explicitContent: track.explicit,
      recommendation: this._getRecommendation(status)
    };
  }

  /**
   * Assess copyright/DMCA risk
   */
  _assessCopyrightRisk(track) {
    // Check if from major label
    const label = track.label || '';
    for (const flaggedLabel of this.flaggedLabels) {
      if (label.includes(flaggedLabel)) {
        return { level: 'high', reason: 'Major record label' };
      }
    }

    // Check popularity as proxy for licensing status
    if (track.popularity > 90) {
      return { level: 'high', reason: 'Extremely popular track' };
    } else if (track.popularity > 70) {
      return { level: 'medium', reason: 'Popular track' };
    }

    return { level: 'low', reason: 'Independent or low popularity' };
  }

  /**
   * Check if artist is verified streaming-safe
   */
  isStreamerSafe(artistName) {
    return this.dmcaSafeArtists.has(artistName);
  }

  /**
   * Add artist to safe list
   */
  addSafeArtist(artistName) {
    this.dmcaSafeArtists.add(artistName);
    this._saveSafeList();
  }

  /**
   * Remove artist from safe list
   */
  removeSafeArtist(artistName) {
    this.dmcaSafeArtists.delete(artistName);
    this._saveSafeList();
  }

  /**
   * Get recommendation based on safety status
   */
  _getRecommendation(status) {
    const recommendations = {
      'safe': 'This track is safe to use on stream',
      'caution': 'Use with caution - monitor for copyright claims',
      'risky': 'High risk - consider alternatives or verify licensing',
      'blocked': 'Not recommended for streaming - find safe alternative'
    };

    return recommendations[status] || 'Unknown safety status';
  }

  /**
   * Filter track list to only safe tracks
   * @param {Array} tracks - Tracks to filter
   * @returns {Array} Safe tracks only
   */
  filterSafeTracks(tracks) {
    return tracks.filter(track => {
      const assessment = this.assessTrack(track);
      return assessment.status === 'safe' || assessment.status === 'caution';
    });
  }

  /**
   * Get streaming platform-specific recommendations
   */
  getPlatformGuidance(platform = 'twitch') {
    const guidance = {
      twitch: {
        name: 'Twitch',
        guidelines: [
          'Use Twitch Soundtrack for licensed music',
          'Mute VODs if using copyrighted music',
          'Prefer indie/royalty-free music for safe streaming',
          'Monitor DMCA notifications in Creator Dashboard'
        ],
        safeSources: [
          'Twitch Soundtrack',
          'Pretzel Rocks',
          'StreamBeats by Harris Heller',
          'NCS (NoCopyrightSounds)',
          'Chillhop Music'
        ]
      },
      youtube: {
        name: 'YouTube',
        guidelines: [
          'Check Content ID before streaming',
          'Use YouTube Audio Library tracks',
          'Some songs allowed with monetization share',
          'Live streams may have different rules than VODs'
        ],
        safeSources: [
          'YouTube Audio Library',
          'Creative Commons music',
          'Epidemic Sound (with license)',
          'Artlist (with license)'
        ]
      },
      facebook: {
        name: 'Facebook Gaming',
        guidelines: [
          'Use Facebook Sound Collection',
          'Avoid top 40 hits and popular music',
          'Music over 90 seconds may be detected',
          'Gaming content has some music allowances'
        ],
        safeSources: [
          'Facebook Sound Collection',
          'Royalty-free music libraries'
        ]
      }
    };

    return guidance[platform.toLowerCase()] || guidance.twitch;
  }

  /**
   * Save safe artist list to storage
   */
  _saveSafeList() {
    const list = Array.from(this.dmcaSafeArtists);
    localStorage.setItem('safe_artists', JSON.stringify(list));
  }

  /**
   * Load safe artist list from storage
   */
  loadSafeList() {
    const stored = localStorage.getItem('safe_artists');
    if (stored) {
      try {
        const list = JSON.parse(stored);
        this.dmcaSafeArtists = new Set(list);
      } catch (err) {
        console.error('Failed to load safe artists:', err);
      }
    }
  }

  /**
   * Update filter settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }
}

/**
 * Live Stream Monitor - Real-time content monitoring
 */
export class StreamMonitor {
  constructor(contentFilter) {
    this.filter = contentFilter;
    this.currentTrack = null;
    this.listeners = new Map();
    this.violations = [];
  }

  /**
   * Monitor a track being played
   */
  monitorTrack(track) {
    this.currentTrack = track;
    const assessment = this.filter.assessTrack(track);

    // Log violations
    if (assessment.status === 'risky' || assessment.status === 'blocked') {
      const violation = {
        track: track,
        assessment: assessment,
        timestamp: Date.now()
      };
      this.violations.push(violation);
      this._emit('violation', violation);
    }

    this._emit('track_assessed', { track, assessment });

    return assessment;
  }

  /**
   * Get violation history
   */
  getViolations() {
    return this.violations;
  }

  /**
   * Clear violation history
   */
  clearViolations() {
    this.violations = [];
  }

  /**
   * Get streaming session report
   */
  getSessionReport() {
    const totalViolations = this.violations.length;
    const highRisk = this.violations.filter(v => v.assessment.status === 'blocked').length;
    const mediumRisk = this.violations.filter(v => v.assessment.status === 'risky').length;

    return {
      totalViolations: totalViolations,
      highRiskPlays: highRisk,
      mediumRiskPlays: mediumRisk,
      violations: this.violations,
      recommendation: totalViolations === 0
        ? 'Stream appears content-safe'
        : `${totalViolations} potential copyright issues detected - review violations`
    };
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error('Monitor event error:', e);
        }
      });
    }
  }
}
