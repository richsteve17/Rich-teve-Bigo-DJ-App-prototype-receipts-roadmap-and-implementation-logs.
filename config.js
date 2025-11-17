// config.js
// Central configuration for BIGO DJ App
// IMPORTANT: Never commit actual API keys to git. Use environment variables in production.

export const config = {
  // Spotify Web API Configuration
  // Get your credentials at: https://developer.spotify.com/dashboard
  spotify: {
    clientId: '29de935743cf4c91bc0a07054077b039', // Spotify app client ID
    // IMPORTANT: Spotify requires explicit loopback IP (127.0.0.1), NOT localhost
    // When testing locally, use: http://127.0.0.1:8000/app/web/dj-mixer/callback.html
    redirectUri: 'http://127.0.0.1:8000/app/web/dj-mixer/callback.html',
    scopes: [
      'streaming',                    // Web Playback SDK
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-top-read'                 // For AI recommendations
    ].join(' ')
  },

  // Audio Analysis Settings
  audio: {
    fftSize: 2048,                    // FFT size for frequency analysis
    smoothingTimeConstant: 0.8,       // Analyser smoothing
    minBPM: 60,                       // Minimum detectable BPM
    maxBPM: 200,                      // Maximum detectable BPM
    beatThreshold: 0.7                // Beat detection sensitivity
  },

  // DJ Mixer Settings
  mixer: {
    crossfaderCurve: 'linear',        // linear | logarithmic | constant-power
    eqBands: {
      low: { freq: 100, q: 1.0 },     // Bass
      mid: { freq: 1000, q: 1.0 },    // Midrange
      high: { freq: 10000, q: 1.0 }   // Treble
    }
  },

  // AI Recommendation Engine
  ai: {
    maxSuggestions: 10,                // Number of suggestions to display
    matchingFactors: {
      bpm: 0.4,                        // 40% weight on BPM similarity
      energy: 0.3,                     // 30% weight on energy level
      key: 0.2,                        // 20% weight on harmonic key
      genre: 0.1                       // 10% weight on genre
    },
    bpmTolerance: 5                    // +/- BPM range for matches
  },

  // Streamer-Safe Music Settings
  contentFilter: {
    explicitContent: false,            // Block explicit tracks
    copyrightSafe: true,               // Prefer copyright-safe music
    dmcaRisk: 'low'                    // low | medium | high - acceptable DMCA risk
  },

  // App Settings
  app: {
    enableTutorial: true,              // Show tutorial for new users
    theme: 'dark',                     // dark | light
    visualizationType: 'waveform'      // waveform | spectrum | circular
  }
};

// Helper: Get Spotify authorization URL
export function getSpotifyAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'token',
    redirect_uri: config.spotify.redirectUri,
    scope: config.spotify.scopes,
    show_dialog: 'false'
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Helper: Parse OAuth token from URL hash
export function parseSpotifyToken() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    access_token: params.get('access_token'),
    token_type: params.get('token_type'),
    expires_in: parseInt(params.get('expires_in'))
  };
}

// Helper: Store token in localStorage with expiration
export function storeToken(tokenData) {
  const expiresAt = Date.now() + (tokenData.expires_in * 1000);
  localStorage.setItem('spotify_access_token', tokenData.access_token);
  localStorage.setItem('spotify_token_expires_at', expiresAt.toString());
}

// Helper: Get valid token or null if expired
export function getValidToken() {
  const token = localStorage.getItem('spotify_access_token');
  const expiresAt = parseInt(localStorage.getItem('spotify_token_expires_at'));

  if (!token || !expiresAt) return null;
  if (Date.now() >= expiresAt) {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expires_at');
    return null;
  }

  return token;
}
