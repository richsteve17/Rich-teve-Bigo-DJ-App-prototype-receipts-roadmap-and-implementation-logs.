// app.js
// Main BIGO DJ Application Controller
// Ties together all modules: Spotify, local tracks, AI, beat matching, tutorial, etc.

import { initSpotifyAPI, searchTracks, isAuthenticated, loginToSpotify } from '../../integrations/spotify/api.js';
import { SpotifyPlayer, DJDeck } from '../../integrations/spotify/player.js';
import { SpotifyDeckWithCapture } from '../../integrations/spotify/tabCapture.js';
import { LocalTrackLibrary, LocalTrackPlayer } from '../../core/library/localTracks.js';
import { BeatMatcher, Crossfader, AutoDJ } from '../../core/mixing/beatMatching.js';
import { AIRecommendationEngine, PlaylistGenerator } from '../../ai/recommendations.js';
import { ContentFilter, StreamMonitor } from '../../core/safety/contentFilter.js';
import { DJTutorial } from '../../ui/tutorial/djTutorial.js';
import { startRoom, stopRoom, getState, events } from '../../core/session/room.js';
import { ModeManager, AppMode } from '../../core/modes.js';
import { getDemoTracks, searchDemoTracks } from '../../data/demoTracks.js';
import { showModeSelector, createModeIndicator, confirmModeChange, showFirstTimeSetup } from '../../ui/components/modeSelector.js';
import { showDisclaimer, maybeShowDisclaimer, createWarningBadge, createInfoBadge } from '../../ui/components/disclaimers.js';
import { CueSystem, TrackStaging } from '../../core/streaming/cueing.js';
import { MixRecorder } from '../../core/streaming/recording.js';
import { CameraManager } from '../../core/streaming/camera.js';
import { Soundboard } from '../../core/effects/soundboard.js';

class BiGoDJApp {
  constructor() {
    this.audioContext = null;
    this.deckA = null;
    this.deckB = null;
    this.beatMatcher = null;
    this.crossfader = null;
    this.aiEngine = null;
    this.contentFilter = null;
    this.streamMonitor = null;
    this.tutorial = null;
    this.localLibrary = null;
    this.modeManager = null;
    this.cueSystem = null;
    this.trackStaging = null;
    this.recorder = null;
    this.camera = null;
    this.soundboard = null;
    this.masterGainNode = null;
    this.allTracks = [];
    this.currentDeck = 'A';
    this.isFirstRun = !localStorage.getItem('bigo_dj_mode');
    this.isMobile = this.detectMobile();
  }

  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

    // Also check for touch support and screen size
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;

    console.log('🔍 Mobile Detection:', {
      userAgent: navigator.userAgent,
      isMobileUA,
      hasTouch,
      isSmallScreen,
      screenWidth: window.innerWidth
    });

    return isMobileUA || (hasTouch && isSmallScreen);
  }

  async init() {
    console.log('🎵 Initializing BIGO DJ App...');
    console.log('📱 Is Mobile:', this.isMobile);

    // Initialize mode manager
    this.modeManager = new ModeManager();

    // ALWAYS show tap-to-start if we detect ANY mobile characteristics
    // This is more aggressive to ensure we never hang on mobile
    const needsUserGesture = this.isMobile ||
                             'ontouchstart' in window ||
                             navigator.maxTouchPoints > 0 ||
                             /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);

    if (needsUserGesture) {
      console.log('✅ Showing mobile tap-to-start overlay (user gesture required)');
      this.showMobileTapToStart();
      return;
    }

    console.log('⚠️ Desktop mode - continuing normal init');

    // Show first-time setup if needed
    if (this.isFirstRun) {
      showFirstTimeSetup((mode) => {
        this.modeManager.setMode(mode);
        this.continueInit();
      });
      return;
    }

    await this.continueInit();
  }

  showMobileTapToStart() {
    const overlay = document.createElement('div');
    overlay.id = 'mobile-start-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: 'Arial', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h1 style="font-size: 3em; margin-bottom: 20px;">🎵</h1>
        <h2 style="font-size: 1.8em; margin-bottom: 10px;">BIGO DJ</h2>
        <p style="font-size: 1.2em; color: #888; margin-bottom: 40px;">Mobile Edition</p>
        <button id="mobile-start-btn" style="
          background: linear-gradient(135deg, #00d9ff, #ff006e);
          border: none;
          color: white;
          font-size: 1.5em;
          padding: 20px 60px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 20px rgba(255, 0, 110, 0.4);
        ">TAP TO START</button>
        <p style="font-size: 0.9em; color: #666; margin-top: 30px;">Audio playback requires interaction on mobile</p>
      </div>
    `;

    document.body.appendChild(overlay);

    const startBtn = document.getElementById('mobile-start-btn');
    startBtn.addEventListener('click', async () => {
      // Remove overlay
      overlay.remove();

      // Continue with normal initialization
      if (this.isFirstRun) {
        showFirstTimeSetup((mode) => {
          this.modeManager.setMode(mode);
          this.continueInit();
        });
      } else {
        await this.continueInit();
      }
    });
  }

  async continueInit() {
    const mode = this.modeManager.getMode();
    console.log(`🎮 Starting in ${mode} mode`);

    // Initialize Audio Context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Resume AudioContext if suspended (Mobile Safari requirement)
    if (this.audioContext.state === 'suspended') {
      console.log('⚠️ AudioContext suspended - resuming...');
      try {
        await this.audioContext.resume();
        console.log('✅ AudioContext resumed successfully');
      } catch (err) {
        console.error('Failed to resume AudioContext:', err);
        this.updateStatus('Audio initialization failed');
        return;
      }
    }

    console.log(`🔊 AudioContext state: ${this.audioContext.state}`);

    // Initialize Streaming Features (CUE, Staging, Recording, Camera)
    this.cueSystem = new CueSystem(this.audioContext);
    this.trackStaging = new TrackStaging();
    this.camera = new CameraManager();

    // Create master gain node for recording
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.connect(this.audioContext.destination);
    this.recorder = new MixRecorder(this.masterGainNode);

    // Initialize Soundboard (routes to master)
    this.soundboard = new Soundboard(this.audioContext, this.masterGainNode);
    await this.soundboard.loadDefaultSamples();

    // Initialize Core Modules based on mode
    this.tutorial = new DJTutorial();

    if (mode === AppMode.FULL || mode === AppMode.SIMPLE) {
      this.localLibrary = new LocalTrackLibrary();
      this.localLibrary.init(this.audioContext);
    }

    if (mode === AppMode.FULL) {
      this.aiEngine = new AIRecommendationEngine();
      this.contentFilter = new ContentFilter();
      this.streamMonitor = new StreamMonitor(this.contentFilter);

      // Initialize Spotify
      const spotifyStatus = initSpotifyAPI();
      if (spotifyStatus.authenticated) {
        console.log('✅ Spotify authenticated');
        this.updateSpotifyButton(true);
      } else {
        console.log('⚠️ Spotify not authenticated');
      }
    }

    // Load tracks based on mode
    if (mode === AppMode.DEMO) {
      this.allTracks = getDemoTracks();
      console.log('📦 Loaded demo tracks:', this.allTracks.length);
    }

    // Initialize Decks
    await this.initDecks();

    // Setup UI Event Listeners
    this.setupEventListeners();

    // Configure UI for current mode
    this.configureUIForMode();

    // Start room/session
    try {
      await startRoom({ appName: 'BIGO DJ' });
      this.updateStatus('Ready to DJ!');
    } catch (err) {
      console.error('Room start error:', err);
      this.updateStatus('Error initializing');
    }

    // Show mode-specific disclaimers
    this.showModeDisclaimers();

    // Check if tutorial should start
    if (this.tutorial.getProgress().completed === 0 && mode !== AppMode.SIMPLE) {
      setTimeout(() => {
        if (confirm('Welcome to BIGO DJ! Would you like to start the tutorial?')) {
          this.tutorial.start();
        }
      }, 2000);
    }

    console.log('✅ BIGO DJ Ready!');
  }

  configureUIForMode() {
    const config = this.modeManager.getUIConfig();
    const mode = this.modeManager.getMode();

    // Update header title
    document.querySelector('.logo').textContent = config.headerTitle;

    // Show/hide Spotify login
    const spotifyBtn = document.getElementById('spotify-login');
    if (spotifyBtn) {
      spotifyBtn.style.display = config.showSpotifyLogin ? 'block' : 'none';
    }

    // Show/hide AI suggestions panel
    const suggestionsPanel = document.querySelector('.sidebar-right');
    if (suggestionsPanel) {
      suggestionsPanel.style.display = config.showAISuggestions ? 'flex' : 'none';
    }

    // Show/hide streamer safe filter
    const safeFilter = document.getElementById('filter-safe-only');
    if (safeFilter && safeFilter.parentElement) {
      safeFilter.parentElement.style.display = config.showStreamerSafe ? 'block' : 'none';
    }

    // Show/hide Deck B for simple mode
    const deckB = document.getElementById('deck-b');
    if (deckB) {
      deckB.style.display = config.showDualDecks ? 'flex' : 'none';
    }

    // Show/hide crossfader
    const crossfaderSection = document.getElementById('crossfader-section');
    if (crossfaderSection) {
      crossfaderSection.style.display = config.showCrossfader ? 'block' : 'none';
    }

    // Show/hide file upload for demo mode
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
      uploadBtn.style.display = config.showFileUpload ? 'block' : 'none';
    }

    // Add mode indicator to header
    const topControls = document.querySelector('.top-controls');
    if (topControls && !document.getElementById('mode-indicator')) {
      const modeIndicator = createModeIndicator(mode, () => {
        showModeSelector(mode, (newMode) => {
          confirmModeChange(mode, newMode, () => {
            this.switchMode(newMode);
          });
        });
      });
      topControls.insertBefore(modeIndicator, topControls.firstChild);
    }

    // Update track browser
    this.updateTrackBrowser();
  }

  switchMode(newMode) {
    this.modeManager.setMode(newMode);
    this.updateStatus('Switching modes...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  showModeDisclaimers() {
    const mode = this.modeManager.getMode();

    if (mode === AppMode.DEMO) {
      maybeShowDisclaimer('demoMode', 1000);
    } else if (mode === AppMode.SIMPLE) {
      maybeShowDisclaimer('simpleMode', 1000);
    } else if (mode === AppMode.FULL) {
      // Show limitation disclaimers for full mode features
      maybeShowDisclaimer('headphoneCueing', 2000);
    }
  }

  async initDecks() {
    const mode = this.modeManager.getMode();

    // Audio routing: Deck -> CUE Gain -> Crossfader Gain -> Master -> Destination

    // Get CUE system gain nodes
    const cueGainA = this.cueSystem.getCueGain('A');
    const cueGainB = this.cueSystem.getCueGain('B');

    // Create crossfader gain nodes
    const crossfaderGainA = this.audioContext.createGain();
    const crossfaderGainB = this.audioContext.createGain();

    // Wire: CUE gains -> Crossfader gains -> Master
    cueGainA.disconnect(); // Disconnect from CUE system's master
    cueGainB.disconnect();
    cueGainA.connect(crossfaderGainA);
    cueGainB.connect(crossfaderGainB);
    crossfaderGainA.connect(this.masterGainNode);
    crossfaderGainB.connect(this.masterGainNode);

    // Initialize decks based on mode and authentication
    if (mode === AppMode.FULL && isAuthenticated()) {
      // Use Spotify Web Playback SDK for Full Mode
      try {
        const baseDeckA = new DJDeck('BIGO DJ - Deck A', this.audioContext);
        const baseDeckB = new DJDeck('BIGO DJ - Deck B', this.audioContext);

        await baseDeckA.init();
        await baseDeckB.init();

        // Wrap with tab capture for EQ support
        this.deckA = new SpotifyDeckWithCapture('BIGO DJ - Deck A', this.audioContext, baseDeckA);
        this.deckB = new SpotifyDeckWithCapture('BIGO DJ - Deck B', this.audioContext, baseDeckB);

        console.log('✅ Spotify Web Playback SDK initialized with EQ capture support');
        this.updateStatus('Spotify players ready! Enable EQ mode for full control.');
      } catch (err) {
        console.error('Spotify player init failed:', err);
        this.updateStatus('Spotify player error - using local playback');
        // Fallback to local players with CUE routing
        this.deckA = new LocalTrackPlayer(this.audioContext, cueGainA);
        this.deckB = new LocalTrackPlayer(this.audioContext, cueGainB);
      }
    } else {
      // Use local track players for Demo and Simple modes, routed through CUE system
      this.deckA = new LocalTrackPlayer(this.audioContext, cueGainA);
      this.deckB = new LocalTrackPlayer(this.audioContext, cueGainB);
    }

    // Setup beat matcher
    this.beatMatcher = new BeatMatcher(this.deckA, this.deckB);

    // Setup crossfader (controls the crossfader gain nodes)
    this.crossfader = new Crossfader(crossfaderGainA, crossfaderGainB);
  }

  setupEventListeners() {
    // Spotify Login
    document.getElementById('spotify-login').addEventListener('click', () => {
      if (!isAuthenticated()) {
        loginToSpotify();
      } else {
        alert('Already connected to Spotify!');
      }
    });

    // EQ Mode Toggle (Tab Capture for Spotify)
    document.getElementById('eq-mode-btn').addEventListener('click', async () => {
      const button = document.getElementById('eq-mode-btn');
      const mode = this.modeManager.getMode();

      // Only works with Spotify decks
      if (mode !== AppMode.FULL || !isAuthenticated()) {
        alert('EQ Mode requires Spotify authentication in Full Mode');
        return;
      }

      // Check if decks support capture mode
      if (!this.deckA.enableCaptureMode || !this.deckB.enableCaptureMode) {
        alert('EQ Mode not available (using local playback)');
        return;
      }

      // Toggle capture mode
      if (!this.deckA.captureMode) {
        // Enable capture mode
        button.textContent = '⏳ Starting EQ Mode...';
        button.disabled = true;

        const resultA = await this.deckA.enableCaptureMode(this.cueSystem.getCueGain('A'));
        const resultB = await this.deckB.enableCaptureMode(this.cueSystem.getCueGain('B'));

        button.disabled = false;

        if (resultA.success && resultB.success) {
          button.textContent = '🎚️ EQ ON';
          button.classList.add('active');
          button.style.backgroundColor = '#00ff88';
          button.style.color = '#000';
          this.updateStatus('EQ Mode enabled! Full control active. ~50-100ms latency.');

          // Show explanation
          alert(
            '✅ EQ MODE ENABLED\n\n' +
            'Your EQ knobs now have FULL control over Spotify audio!\n\n' +
            'How it works:\n' +
            '• Captures this tab\'s audio\n' +
            '• Routes through Web Audio API with real EQ processing\n' +
            '• Adds ~50-100ms latency (normal for DJ mixing)\n\n' +
            'Tip: Use visual waveforms for beatmatching (latency-compensated)'
          );
        } else {
          button.textContent = '🎚️ EQ';
          this.updateStatus('EQ Mode failed: ' + (resultA.error || resultB.error));
          alert(
            'EQ Mode Setup Failed\n\n' +
            (resultA.error || resultB.error) + '\n\n' +
            'Tips:\n' +
            '• Make sure to select THIS TAB when prompted\n' +
            '• Check "Share audio" checkbox\n' +
            '• Use Chrome or Edge browser\n' +
            '• Grant microphone/screen share permissions'
          );
        }
      } else {
        // Disable capture mode
        await this.deckA.disableCaptureMode();
        await this.deckB.disableCaptureMode();

        button.textContent = '🎚️ EQ';
        button.classList.remove('active');
        button.style.backgroundColor = '';
        button.style.color = '';
        this.updateStatus('EQ Mode disabled - returned to standard Spotify mode');
      }
    });

    // Tutorial
    document.getElementById('tutorial-btn').addEventListener('click', () => {
      this.tutorial.start();
    });

    // Track Search
    const searchInput = document.getElementById('track-search');
    searchInput.addEventListener('input', (e) => {
      this.debounce(() => this.searchTracks(e.target.value), 300);
    });

    // File Upload
    document.getElementById('upload-btn').addEventListener('click', () => {
      document.getElementById('file-upload').click();
    });

    document.getElementById('file-upload').addEventListener('change', async (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        this.updateStatus('Uploading files...');
        const tracks = await this.localLibrary.uploadFiles(files);
        this.allTracks.push(...tracks);
        this.updateTrackBrowser();
        this.updateStatus(`Uploaded ${tracks.length} tracks`);
      }
    });

    // Deck A Controls
    document.getElementById('play-a').addEventListener('click', () => {
      this.togglePlay('A');
    });

    document.getElementById('cue-a').addEventListener('click', () => {
      this.cueSystem.toggleCue('A');
    });

    // Deck B Controls
    document.getElementById('play-b').addEventListener('click', () => {
      this.togglePlay('B');
    });

    document.getElementById('cue-b').addEventListener('click', () => {
      this.cueSystem.toggleCue('B');
    });

    // Sync Button
    document.getElementById('sync-button').addEventListener('click', async () => {
      const timeA = this.deckA.getCurrentTime();
      const timeB = this.deckB.getCurrentTime();
      await this.beatMatcher.autoSync(timeA, timeB);
      this.updateStatus('Decks synced!');
    });

    // Crossfader
    const crossfader = document.getElementById('crossfader');
    crossfader.addEventListener('input', async (e) => {
      const position = parseFloat(e.target.value);
      this.crossfader.setPosition(position);
      this.updateCrossfaderDisplay(position);

      // For Spotify decks, also update their volume based on crossfader
      if (this.deckA && typeof this.deckA.setCrossfaderPosition === 'function') {
        await this.deckA.setCrossfaderPosition(position);
      }
      if (this.deckB && typeof this.deckB.setCrossfaderPosition === 'function') {
        await this.deckB.setCrossfaderPosition(position);
      }
    });

    // EQ Controls (Deck A)
    document.querySelectorAll('#deck-a .eq-section input').forEach(input => {
      input.addEventListener('input', (e) => {
        const band = e.target.className.split('-')[1];
        const value = parseFloat(e.target.value);
        this.deckA.setEQ(band, value);
        e.target.nextElementSibling.textContent = value.toFixed(1);
      });
    });

    // EQ Controls (Deck B)
    document.querySelectorAll('#deck-b .eq-section input').forEach(input => {
      input.addEventListener('input', (e) => {
        const band = e.target.className.split('-')[1];
        const value = parseFloat(e.target.value);
        this.deckB.setEQ(band, value);
        e.target.nextElementSibling.textContent = value.toFixed(1);
      });
    });

    // Volume Controls
    document.getElementById('volume-a').addEventListener('input', async (e) => {
      const volume = parseFloat(e.target.value);
      if (typeof this.deckA.setVolume === 'function') {
        await this.deckA.setVolume(volume);
      }
    });

    document.getElementById('volume-b').addEventListener('input', async (e) => {
      const volume = parseFloat(e.target.value);
      if (typeof this.deckB.setVolume === 'function') {
        await this.deckB.setVolume(volume);
      }
    });

    // Master Volume
    document.getElementById('master-volume').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.audioContext.destination.volume = value;
      document.getElementById('master-value').textContent = `${Math.round(value * 100)}%`;
    });

    // AI Suggestions Refresh
    document.getElementById('refresh-suggestions').addEventListener('click', () => {
      this.updateSuggestions();
    });

    // Auto DJ Toggle
    document.getElementById('auto-dj-toggle').addEventListener('click', () => {
      // TODO: Implement Auto DJ toggle
      alert('Auto DJ feature coming soon!');
    });

    // Streamer Safe Filter
    document.getElementById('filter-safe-only').addEventListener('change', (e) => {
      this.updateTrackBrowser();
    });

    // Recording Button
    document.getElementById('record-btn').addEventListener('click', () => {
      if (this.recorder.isRecording) {
        this.recorder.stopRecording();
        this.updateStatus('Recording stopped');
      } else {
        const result = this.recorder.startRecording();
        if (result.success) {
          this.updateStatus('Recording started');
        } else {
          this.updateStatus(`Recording error: ${result.error}`);
        }
      }
    });

    // Camera Button
    document.getElementById('camera-btn').addEventListener('click', async () => {
      const result = await this.camera.toggle();
      const videoElement = document.getElementById('camera-preview');
      const button = document.getElementById('camera-btn');

      if (result.success) {
        if (this.camera.isRunning()) {
          videoElement.style.display = 'block';
          button.classList.add('active');
          button.textContent = '📹 STOP CAM';
          this.updateStatus('Camera started');
        } else {
          videoElement.style.display = 'none';
          button.classList.remove('active');
          button.textContent = '📹 CAMERA';
          this.updateStatus('Camera stopped');
        }
      } else {
        this.updateStatus(`Camera error: ${result.error}`);
        alert(`Camera Error: ${result.error}\n\nPlease check your browser permissions.`);
      }
    });

    // Track Staging - Load staged track
    window.addEventListener('load_staged', (e) => {
      const { track, deck } = e.detail;
      this.loadTrack(track, deck);
    });

    // Waveform Scrubbing - Click to seek
    document.getElementById('waveform-a').addEventListener('click', (e) => {
      this.scrubWaveform(e, 'A');
    });

    document.getElementById('waveform-b').addEventListener('click', (e) => {
      this.scrubWaveform(e, 'B');
    });

    // Soundboard Pads
    document.querySelectorAll('.sound-pad').forEach(pad => {
      pad.addEventListener('click', (e) => {
        const padId = e.target.dataset.pad;
        const result = this.soundboard.play(padId, 0.8);
        if (result.success) {
          e.target.classList.add('active');
          setTimeout(() => e.target.classList.remove('active'), 200);
        }
      });
    });

    // Start waveform animation
    this.startWaveformAnimation();
  }

  async searchTracks(query) {
    if (!query || query.length < 2) {
      this.updateTrackBrowser(this.allTracks);
      return;
    }

    try {
      if (isAuthenticated()) {
        const spotifyTracks = await searchTracks(query, 20);
        const localTracks = this.localLibrary.searchTracks(query);
        this.updateTrackBrowser([...spotifyTracks, ...localTracks]);
      } else {
        const localTracks = this.localLibrary.searchTracks(query);
        this.updateTrackBrowser(localTracks);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  updateTrackBrowser(tracks = this.allTracks) {
    const browser = document.getElementById('track-browser');
    const safeOnly = document.getElementById('filter-safe-only')?.checked || false;

    let displayTracks = tracks;
    if (safeOnly && this.contentFilter) {
      displayTracks = this.contentFilter.filterSafeTracks(tracks);
    }

    if (displayTracks.length === 0) {
      browser.innerHTML = '<div class="empty-state"><p>No tracks found</p></div>';
      return;
    }

    browser.innerHTML = displayTracks.map(track => {
      // Only assess track safety if contentFilter is available (Full Mode)
      const safety = this.contentFilter
        ? this.contentFilter.assessTrack(track)
        : { status: 'safe', safetyScore: 1.0 };

      return `
        <div class="track-item" data-track-id="${track.id}">
          <div class="track-item-title">${track.name}</div>
          <div class="track-item-artist">${track.artist}</div>
          <div class="track-item-meta">
            <span>${track.bpm || '--'} BPM</span>
            ${this.contentFilter ? `<span class="safety-badge ${safety.status}">${safety.status}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    browser.querySelectorAll('.track-item').forEach(item => {
      // Single click - Stage track for loading
      item.addEventListener('click', () => {
        const trackId = item.dataset.trackId;
        const track = displayTracks.find(t => t.id === trackId);
        this.trackStaging.stageTrack(track, this.currentDeck);
        this.updateStatus(`Staged "${track.name}" for Deck ${this.currentDeck}`);
      });

      // Double click - Load and play immediately
      item.addEventListener('dblclick', () => {
        const trackId = item.dataset.trackId;
        const track = displayTracks.find(t => t.id === trackId);
        this.loadTrack(track, this.currentDeck);
        setTimeout(() => this.togglePlay(this.currentDeck), 100);
      });
    });

    this.updateStatus(`${displayTracks.length} tracks`);
  }

  async loadTrack(track, deck) {
    const targetDeck = deck === 'A' ? this.deckA : this.deckB;
    const deckElement = deck === 'A' ? 'deck-a' : 'deck-b';

    try {
      if (track.source === 'local' || track.source === 'demo') {
        // Local or demo tracks
        await targetDeck.loadTrack(track);
      } else if (track.uri) {
        // Spotify tracks - use Web Playback SDK
        if (typeof targetDeck.loadTrack === 'function' && targetDeck.spotifyPlayer) {
          // DJDeck with Spotify player
          await targetDeck.loadTrack(track.uri, track.bpm || track.tempo || 0);
        } else {
          throw new Error('Spotify playback not available in this mode');
        }
      } else {
        throw new Error('Invalid track format');
      }

      // Update UI
      document.getElementById(`track-title-${deck.toLowerCase()}`).textContent = track.name;
      document.getElementById(`track-artist-${deck.toLowerCase()}`).textContent = track.artist;
      document.getElementById(`bpm-${deck.toLowerCase()}`).textContent = track.bpm || '--';

      // Update safety indicator (only in Full Mode)
      if (this.contentFilter) {
        const safety = this.contentFilter.assessTrack(track);
        const indicator = document.getElementById(`safety-indicator-${deck.toLowerCase()}`);
        const dot = indicator.querySelector('.safety-dot');
        dot.className = `safety-dot ${safety.status}`;
      }

      // Update current deck
      this.currentDeck = deck === 'A' ? 'B' : 'A';

      // Update suggestions
      this.updateSuggestions(track);

      this.updateStatus(`Loaded "${track.name}" to Deck ${deck}`);
    } catch (err) {
      console.error('Load track error:', err);
      this.updateStatus('Error loading track');
    }
  }

  togglePlay(deck) {
    const targetDeck = deck === 'A' ? this.deckA : this.deckB;
    const button = document.getElementById(`play-${deck.toLowerCase()}`);

    targetDeck.togglePlay();

    if (targetDeck.isPlaying) {
      button.textContent = '⏸';
      button.classList.add('playing');
    } else {
      button.textContent = '▶';
      button.classList.remove('playing');
    }
  }

  scrubWaveform(event, deck) {
    const targetDeck = deck === 'A' ? this.deckA : this.deckB;
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;

    // Get track duration
    let duration = 0;
    if (targetDeck.currentTrack) {
      // For Spotify tracks
      if (targetDeck.currentTrack.duration_ms) {
        duration = targetDeck.currentTrack.duration_ms / 1000;
      }
      // For local tracks
      else if (targetDeck.currentTrack.duration) {
        duration = targetDeck.currentTrack.duration / 1000;
      }
      // Fallback: try to get from audio element
      else if (targetDeck.audioElement && targetDeck.audioElement.duration) {
        duration = targetDeck.audioElement.duration;
      }
    }

    if (duration > 0) {
      const seekTime = percentage * duration;
      targetDeck.seek(seekTime);
      this.updateStatus(`Scrubbed to ${seekTime.toFixed(1)}s`);
    }
  }

  async updateSuggestions(currentTrack = null) {
    if (!currentTrack) return;

    const panel = document.getElementById('suggestions-panel');
    panel.innerHTML = '<div class="empty-state"><p>Loading suggestions...</p></div>';

    try {
      const suggestions = await this.aiEngine.getRecommendations(currentTrack, this.allTracks, 10);

      if (suggestions.length === 0) {
        panel.innerHTML = '<div class="empty-state"><p>No suggestions available</p></div>';
        return;
      }

      panel.innerHTML = suggestions.map(track => `
        <div class="suggestion-item" data-track-id="${track.id}">
          <div class="track-item-title">${track.name}</div>
          <div class="track-item-artist">${track.artist}</div>
          <div class="track-item-meta">
            <span>${track.features?.bpm || track.bpm} BPM</span>
            <span class="match-score">${track.matchPercent}% match</span>
          </div>
          <div class="match-reasons">
            ${track.reasons?.join(' • ') || ''}
          </div>
        </div>
      `).join('');

      // Add click handlers
      panel.querySelectorAll('.suggestion-item').forEach(item => {
        // Single click - Stage track
        item.addEventListener('click', () => {
          const trackId = item.dataset.trackId;
          const track = suggestions.find(t => t.id === trackId);
          this.trackStaging.stageTrack(track, this.currentDeck);
          this.updateStatus(`Staged "${track.name}" for Deck ${this.currentDeck}`);
        });

        // Double click - Load and play immediately
        item.addEventListener('dblclick', () => {
          const trackId = item.dataset.trackId;
          const track = suggestions.find(t => t.id === trackId);
          this.loadTrack(track, this.currentDeck);
          setTimeout(() => this.togglePlay(this.currentDeck), 100);
        });
      });
    } catch (err) {
      console.error('Suggestions error:', err);
      panel.innerHTML = '<div class="empty-state"><p>Error loading suggestions</p></div>';
    }
  }

  startWaveformAnimation() {
    const canvasA = document.getElementById('waveform-a');
    const canvasB = document.getElementById('waveform-b');
    const ctxA = canvasA.getContext('2d');
    const ctxB = canvasB.getContext('2d');

    const animate = () => {
      // Resize canvases
      canvasA.width = canvasA.offsetWidth;
      canvasA.height = canvasA.offsetHeight;
      canvasB.width = canvasB.offsetWidth;
      canvasB.height = canvasB.offsetHeight;

      // Draw waveforms
      this.drawWaveform(ctxA, this.deckA, '#00d9ff');
      this.drawWaveform(ctxB, this.deckB, '#ff006e');

      requestAnimationFrame(animate);
    };

    animate();
  }

  drawWaveform(ctx, deck, color) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.fillStyle = '#1a1f3a';
    ctx.fillRect(0, 0, width, height);

    if (!deck || !deck.analyser) return;

    const dataArray = deck.getWaveformData();
    const bufferLength = dataArray.length;
    const sliceWidth = width / bufferLength;

    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();

    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  updateCrossfaderDisplay(position) {
    const percent = Math.round(((position + 1) / 2) * 100);
    document.querySelector('.crossfader-position').textContent = `${percent}%`;
  }

  updateStatus(message) {
    document.getElementById('room-status').textContent = message;
  }

  updateSpotifyButton(authenticated) {
    const btn = document.getElementById('spotify-login');
    const eqBtn = document.getElementById('eq-mode-btn');

    if (authenticated) {
      btn.style.background = 'linear-gradient(135deg, #1DB954, #1ed760)';
      btn.title = 'Spotify Connected';

      // Show EQ mode button for Spotify users
      if (eqBtn) {
        eqBtn.style.display = 'inline-block';
      }
    } else {
      // Hide EQ mode button if not authenticated
      if (eqBtn) {
        eqBtn.style.display = 'none';
      }
    }
  }

  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new BiGoDJApp();
  await app.init();

  // Make app globally accessible for debugging
  window.biGoDJ = app;
});
