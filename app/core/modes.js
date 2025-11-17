// modes.js
// App mode management: Demo, Simple, and Full modes
// Provides different experience levels for different users

/**
 * App Modes:
 * - DEMO: No Spotify login required, preloaded safe tracks, all features work
 * - SIMPLE: Original feature set (audio capture, basic BPM, visualizer)
 * - FULL: All features including Spotify, AI, advanced mixing
 */

export const AppMode = {
  DEMO: 'demo',
  SIMPLE: 'simple',
  FULL: 'full'
};

export class ModeManager {
  constructor() {
    this.currentMode = this.loadMode() || AppMode.DEMO;
    this.listeners = new Map();
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Set app mode
   */
  setMode(mode) {
    if (!Object.values(AppMode).includes(mode)) {
      console.error('Invalid mode:', mode);
      return;
    }

    this.currentMode = mode;
    this.saveMode();
    this._emit('mode_changed', { mode });
  }

  /**
   * Check if feature is available in current mode
   */
  hasFeature(feature) {
    const features = {
      [AppMode.DEMO]: [
        'dual_decks',
        'basic_eq',
        'crossfader',
        'waveforms',
        'bpm_display',
        'beat_matching',
        'track_browser',
        'tutorial',
        'volume_control',
        'simple_sync'
      ],
      [AppMode.SIMPLE]: [
        'audio_capture',
        'bpm_detection',
        'spectrum_visualizer',
        'basic_controls',
        'single_deck',
        'local_upload',
        'simple_eq',
        'tutorial'
      ],
      [AppMode.FULL]: [
        'spotify_integration',
        'ai_recommendations',
        'advanced_beat_matching',
        'streamer_safe_filter',
        'dual_decks',
        'advanced_eq',
        'crossfader',
        'waveforms',
        'auto_dj',
        'harmonic_mixing',
        'tutorial',
        'local_upload',
        'audio_capture'
      ]
    };

    return features[this.currentMode]?.includes(feature) || false;
  }

  /**
   * Get mode description
   */
  getModeInfo(mode = this.currentMode) {
    const info = {
      [AppMode.DEMO]: {
        name: 'Demo Mode',
        icon: '🎮',
        description: 'Try all features with preloaded tracks. No setup required!',
        features: [
          'No Spotify login needed',
          'Preloaded royalty-free tracks',
          'Full mixer experience',
          'Beat matching & sync',
          'Interactive tutorial'
        ],
        limitations: [
          'Limited track selection (demo tracks only)',
          'Cannot search Spotify catalog',
          'No AI recommendations (demo mode only)',
          'Cannot upload custom files'
        ]
      },
      [AppMode.SIMPLE]: {
        name: 'Simple Mode',
        icon: '🎵',
        description: 'Classic DJ basics. Perfect for learning fundamentals.',
        features: [
          'Single deck operation',
          'Audio capture from mic',
          'BPM detection',
          'Spectrum visualizer',
          'Local file upload',
          'Basic mixing controls'
        ],
        limitations: [
          'No Spotify integration',
          'No AI suggestions',
          'Single deck only',
          'No advanced beat matching',
          'Simplified interface'
        ]
      },
      [AppMode.FULL]: {
        name: 'Full Mode',
        icon: '🚀',
        description: 'Professional DJ platform with all features unlocked.',
        features: [
          'Full Spotify integration',
          'AI-powered track suggestions',
          'Advanced beat matching',
          'Streamer-safe music filter',
          'Dual-deck mixing',
          'Harmonic mixing (Camelot wheel)',
          'Auto DJ mode',
          'Local file support',
          'Complete tutorial system'
        ],
        limitations: [
          'Requires Spotify Premium for full playback',
          'Spotify API rate limits apply',
          'Local files lost on page reload (use IndexedDB for production)',
          'DMCA assessment is guidance only - not legal advice'
        ]
      }
    };

    return info[mode];
  }

  /**
   * Get UI configuration for current mode
   */
  getUIConfig() {
    const configs = {
      [AppMode.DEMO]: {
        showSpotifyLogin: false,
        showAISuggestions: false,
        showStreamerSafe: false,
        showDualDecks: true,
        showCrossfader: true,
        showAdvancedEQ: false,
        showFileUpload: false,
        showTutorial: true,
        showModeHint: true,
        headerTitle: 'BIGO DJ - Demo Mode'
      },
      [AppMode.SIMPLE]: {
        showSpotifyLogin: false,
        showAISuggestions: false,
        showStreamerSafe: false,
        showDualDecks: false,
        showCrossfader: false,
        showAdvancedEQ: false,
        showFileUpload: true,
        showTutorial: true,
        showModeHint: true,
        headerTitle: 'BIGO DJ - Simple Mode'
      },
      [AppMode.FULL]: {
        showSpotifyLogin: true,
        showAISuggestions: true,
        showStreamerSafe: true,
        showDualDecks: true,
        showCrossfader: true,
        showAdvancedEQ: true,
        showFileUpload: true,
        showTutorial: true,
        showModeHint: false,
        headerTitle: 'BIGO DJ'
      }
    };

    return configs[this.currentMode];
  }

  /**
   * Save mode to storage
   */
  saveMode() {
    localStorage.setItem('bigo_dj_mode', this.currentMode);
  }

  /**
   * Load mode from storage
   */
  loadMode() {
    return localStorage.getItem('bigo_dj_mode');
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
          console.error('Mode event error:', e);
        }
      });
    }
  }
}
