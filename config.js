// config.js
// Central configuration for BIGO DJ App
// IMPORTANT: Never commit actual API keys to git. Use environment variables in production.

// Auto-detect environment and set appropriate redirect URI
const isProduction = window.location.hostname === 'richsteve17.github.io';
const redirectUri = isProduction
  ? 'https://richsteve17.github.io/Rich-teve-Bigo-DJ-App-prototype-receipts-roadmap-and-implementation-logs./app/web/dj-mixer/callback.html'
  : 'http://127.0.0.1:8000/app/web/dj-mixer/callback.html';

const spotifyClientId = resolveSpotifyClientId();

export const config = {
  // Spotify Web API Configuration
  // Get your credentials at: https://developer.spotify.com/dashboard
  spotify: {
    clientId: spotifyClientId, // Injected at build/runtime via env.js
    // Auto-detected based on environment:
    // - Production (GitHub Pages): https://richsteve17.github.io/.../callback.html
    // - Local development: http://127.0.0.1:8000/app/web/dj-mixer/callback.html
    redirectUri: redirectUri,
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

function resolveSpotifyClientId() {
  const env = globalThis.__DJ_APP_ENV__ || {};
  const injectedId = env.SPOTIFY_CLIENT_ID || env.spotifyClientId;

  if (!injectedId) {
    console.warn(
      'Spotify Client ID is not configured. Create env.js from env.template.js to enable Spotify features.'
    );
    return null;
  }

  return injectedId;
}

// Helper: Generate PKCE code verifier and challenge
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper: Get Spotify authorization URL with PKCE
export async function getSpotifyAuthUrl() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store code verifier for later use
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'code',
    redirect_uri: config.spotify.redirectUri,
    scope: config.spotify.scopes,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'false'
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Helper: Parse authorization code from URL
export function parseSpotifyCode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

// Helper: Exchange authorization code for access token
export async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: config.spotify.redirectUri,
    code_verifier: codeVerifier
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Token exchange failed');
  }

  const data = await response.json();

  // Clean up code verifier
  localStorage.removeItem('spotify_code_verifier');

  return {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token
  };
}

// Helper: Store token in localStorage with expiration
export function storeToken(tokenData) {
  const expiresAt = Date.now() + (tokenData.expires_in * 1000);
  localStorage.setItem('spotify_access_token', tokenData.access_token);
  localStorage.setItem('spotify_token_expires_at', expiresAt.toString());
  if (tokenData.refresh_token) {
    localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
  }
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
