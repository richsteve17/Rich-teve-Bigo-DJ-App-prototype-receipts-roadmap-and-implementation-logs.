// app.js
// Main BIGO DJ Application Controller
// Ties together all modules: Spotify, local tracks, AI, beat matching, tutorial, etc.

import { initSpotifyAPI, searchTracks, isAuthenticated, loginToSpotify } from '../../integrations/spotify/api.js';
import { SpotifyPlayer, DJDeck } from '../../integrations/spotify/player.js';
import { LocalTrackLibrary, LocalTrackPlayer } from '../../core/library/localTracks.js';
import { BeatMatcher, Crossfader, AutoDJ } from '../../core/mixing/beatMatching.js';
import { AIRecommendationEngine, PlaylistGenerator } from '../../ai/recommendations.js';
import { ContentFilter, StreamMonitor } from '../../core/safety/contentFilter.js';
import { DJTutorial } from '../../ui/tutorial/djTutorial.js';
import { startRoom, stopRoom, getState, events } from '../../core/session/room.js';

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
    this.allTracks = [];
    this.currentDeck = 'A';
  }

  async init() {
    console.log('🎵 Initializing BIGO DJ App...');

    // Initialize Audio Context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Initialize Core Modules
    this.localLibrary = new LocalTrackLibrary();
    this.localLibrary.init(this.audioContext);

    this.aiEngine = new AIRecommendationEngine();
    this.contentFilter = new ContentFilter();
    this.streamMonitor = new StreamMonitor(this.contentFilter);
    this.tutorial = new DJTutorial();

    // Initialize Spotify
    const spotifyStatus = initSpotifyAPI();
    if (spotifyStatus.authenticated) {
      console.log('✅ Spotify authenticated');
      this.updateSpotifyButton(true);
    } else {
      console.log('⚠️ Spotify not authenticated');
    }

    // Initialize Decks
    await this.initDecks();

    // Setup UI Event Listeners
    this.setupEventListeners();

    // Start room/session
    try {
      await startRoom({ appName: 'BIGO DJ' });
      this.updateStatus('Ready to DJ!');
    } catch (err) {
      console.error('Room start error:', err);
      this.updateStatus('Error initializing');
    }

    // Check if tutorial should start
    if (this.tutorial.getProgress().completed === 0) {
      setTimeout(() => {
        if (confirm('Welcome to BIGO DJ! Would you like to start the tutorial?')) {
          this.tutorial.start();
        }
      }, 1000);
    }

    console.log('✅ BIGO DJ Ready!');
  }

  async initDecks() {
    // Create gain nodes for decks
    const deckAGain = this.audioContext.createGain();
    const deckBGain = this.audioContext.createGain();

    // Connect to master output
    deckAGain.connect(this.audioContext.destination);
    deckBGain.connect(this.audioContext.destination);

    // Initialize local track players
    this.deckA = new LocalTrackPlayer(this.audioContext);
    this.deckB = new LocalTrackPlayer(this.audioContext);

    // Setup beat matcher
    this.beatMatcher = new BeatMatcher(this.deckA, this.deckB);

    // Setup crossfader
    this.crossfader = new Crossfader(deckAGain, deckBGain);
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

    // Deck B Controls
    document.getElementById('play-b').addEventListener('click', () => {
      this.togglePlay('B');
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
    crossfader.addEventListener('input', (e) => {
      const position = parseFloat(e.target.value);
      this.crossfader.setPosition(position);
      this.updateCrossfaderDisplay(position);
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
    document.getElementById('volume-a').addEventListener('input', (e) => {
      this.deckA.setVolume(parseFloat(e.target.value));
    });

    document.getElementById('volume-b').addEventListener('input', (e) => {
      this.deckB.setVolume(parseFloat(e.target.value));
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
    const safeOnly = document.getElementById('filter-safe-only').checked;

    let displayTracks = tracks;
    if (safeOnly) {
      displayTracks = this.contentFilter.filterSafeTracks(tracks);
    }

    if (displayTracks.length === 0) {
      browser.innerHTML = '<div class="empty-state"><p>No tracks found</p></div>';
      return;
    }

    browser.innerHTML = displayTracks.map(track => {
      const safety = this.contentFilter.assessTrack(track);
      return `
        <div class="track-item" data-track-id="${track.id}">
          <div class="track-item-title">${track.name}</div>
          <div class="track-item-artist">${track.artist}</div>
          <div class="track-item-meta">
            <span>${track.bpm || '--'} BPM</span>
            <span class="safety-badge ${safety.status}">${safety.status}</span>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    browser.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('click', () => {
        const trackId = item.dataset.trackId;
        const track = displayTracks.find(t => t.id === trackId);
        this.loadTrack(track, this.currentDeck);
      });

      item.addEventListener('dblclick', () => {
        const trackId = item.dataset.trackId;
        const track = displayTracks.find(t => t.id === trackId);
        this.loadTrack(track, this.currentDeck);
        this.togglePlay(this.currentDeck);
      });
    });

    this.updateStatus(`${displayTracks.length} tracks`);
  }

  async loadTrack(track, deck) {
    const targetDeck = deck === 'A' ? this.deckA : this.deckB;
    const deckElement = deck === 'A' ? 'deck-a' : 'deck-b';

    try {
      if (track.source === 'local') {
        await targetDeck.loadTrack(track);
      } else {
        // For Spotify tracks, would use SpotifyPlayer
        alert('Spotify playback requires Web Playback SDK setup. Use local files for now.');
        return;
      }

      // Update UI
      document.getElementById(`track-title-${deck.toLowerCase()}`).textContent = track.name;
      document.getElementById(`track-artist-${deck.toLowerCase()}`).textContent = track.artist;
      document.getElementById(`bpm-${deck.toLowerCase()}`).textContent = track.bpm || '--';

      // Update safety indicator
      const safety = this.contentFilter.assessTrack(track);
      const indicator = document.getElementById(`safety-indicator-${deck.toLowerCase()}`);
      const dot = indicator.querySelector('.safety-dot');
      dot.className = `safety-dot ${safety.status}`;

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
        item.addEventListener('click', () => {
          const trackId = item.dataset.trackId;
          const track = suggestions.find(t => t.id === trackId);
          this.loadTrack(track, this.currentDeck);
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
    if (authenticated) {
      btn.style.background = 'linear-gradient(135deg, #1DB954, #1ed760)';
      btn.title = 'Spotify Connected';
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
