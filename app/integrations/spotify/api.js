// api.js
// Spotify Web API wrapper for BIGO DJ App
// Handles authentication, track search, audio features, and recommendations

import { getValidToken, getSpotifyAuthUrl } from '../../../config.js';

const API_BASE = 'https://api.spotify.com/v1';

// Authentication state
let accessToken = null;

/**
 * Initialize Spotify API - check for existing token
 */
export function initSpotifyAPI() {
  // Check for valid stored token
  accessToken = getValidToken();
  return { authenticated: !!accessToken, token: accessToken };
}

/**
 * Redirect to Spotify login
 */
export async function loginToSpotify() {
  const authUrl = await getSpotifyAuthUrl();
  window.location.href = authUrl;
}

/**
 * Logout and clear tokens
 */
export function logoutSpotify() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_token_expires_at');
  accessToken = null;
}

/**
 * Make authenticated API request
 */
async function spotifyRequest(endpoint, options = {}) {
  if (!accessToken) {
    throw new Error('Not authenticated. Call loginToSpotify() first.');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (response.status === 401) {
    logoutSpotify();
    throw new Error('Token expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Spotify API error');
  }

  return response.json();
}

/**
 * Search for tracks
 * @param {string} query - Search query
 * @param {number} limit - Max results (default: 20)
 * @returns {Promise<Array>} Array of track objects
 */
export async function searchTracks(query, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: limit.toString()
  });

  const data = await spotifyRequest(`/search?${params}`);
  return data.tracks.items.map(track => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    albumArt: track.album.images[0]?.url,
    duration: track.duration_ms,
    uri: track.uri,
    previewUrl: track.preview_url,
    explicit: track.explicit,
    popularity: track.popularity
  }));
}

/**
 * Get audio features for a track (BPM, energy, key, etc.)
 * @param {string} trackId - Spotify track ID
 * @returns {Promise<Object>} Audio features
 */
export async function getAudioFeatures(trackId) {
  const data = await spotifyRequest(`/audio-features/${trackId}`);
  return {
    bpm: Math.round(data.tempo),
    energy: data.energy,              // 0.0 - 1.0
    danceability: data.danceability,  // 0.0 - 1.0
    valence: data.valence,            // 0.0 - 1.0 (happiness)
    key: data.key,                    // Pitch class (0 = C, 1 = C#, etc.)
    mode: data.mode,                  // 0 = minor, 1 = major
    acousticness: data.acousticness,
    instrumentalness: data.instrumentalness,
    loudness: data.loudness,          // dB
    timeSignature: data.time_signature
  };
}

/**
 * Get audio features for multiple tracks (batch)
 * @param {Array<string>} trackIds - Array of Spotify track IDs
 * @returns {Promise<Array>} Array of audio features
 */
export async function getBulkAudioFeatures(trackIds) {
  const ids = trackIds.join(',');
  const data = await spotifyRequest(`/audio-features?ids=${ids}`);
  return data.audio_features.map(f => f ? {
    id: f.id,
    bpm: Math.round(f.tempo),
    energy: f.energy,
    danceability: f.danceability,
    valence: f.valence,
    key: f.key,
    mode: f.mode
  } : null);
}

/**
 * Get AI-powered track recommendations
 * @param {Object} params - Recommendation parameters
 * @returns {Promise<Array>} Recommended tracks
 */
export async function getRecommendations({
  seedTrackIds = [],
  targetBpm = null,
  targetEnergy = null,
  targetDanceability = null,
  limit = 10
}) {
  const params = new URLSearchParams({
    limit: limit.toString()
  });

  if (seedTrackIds.length > 0) {
    params.set('seed_tracks', seedTrackIds.slice(0, 5).join(',')); // Max 5 seeds
  }

  if (targetBpm) {
    params.set('target_tempo', targetBpm.toString());
    params.set('min_tempo', (targetBpm - 5).toString());
    params.set('max_tempo', (targetBpm + 5).toString());
  }

  if (targetEnergy !== null) {
    params.set('target_energy', targetEnergy.toString());
  }

  if (targetDanceability !== null) {
    params.set('target_danceability', targetDanceability.toString());
  }

  const data = await spotifyRequest(`/recommendations?${params}`);
  return data.tracks.map(track => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    albumArt: track.album.images[0]?.url,
    duration: track.duration_ms,
    uri: track.uri,
    explicit: track.explicit,
    popularity: track.popularity
  }));
}

/**
 * Get user's top tracks (for personalized recommendations)
 * @param {string} timeRange - 'short_term', 'medium_term', or 'long_term'
 * @param {number} limit - Max results
 * @returns {Promise<Array>} User's top tracks
 */
export async function getUserTopTracks(timeRange = 'medium_term', limit = 20) {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: limit.toString()
  });

  const data = await spotifyRequest(`/me/top/tracks?${params}`);
  return data.items.map(track => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    uri: track.uri
  }));
}

/**
 * Get user's playlists
 * @returns {Promise<Array>} User's playlists
 */
export async function getUserPlaylists() {
  const data = await spotifyRequest('/me/playlists?limit=50');
  return data.items.map(playlist => ({
    id: playlist.id,
    name: playlist.name,
    trackCount: playlist.tracks.total,
    imageUrl: playlist.images[0]?.url,
    uri: playlist.uri
  }));
}

/**
 * Get tracks from a playlist
 * @param {string} playlistId - Spotify playlist ID
 * @returns {Promise<Array>} Playlist tracks
 */
export async function getPlaylistTracks(playlistId) {
  const data = await spotifyRequest(`/playlists/${playlistId}/tracks`);
  return data.items.map(item => ({
    id: item.track.id,
    name: item.track.name,
    artist: item.track.artists.map(a => a.name).join(', '),
    album: item.track.album.name,
    albumArt: item.track.album.images[0]?.url,
    duration: item.track.duration_ms,
    uri: item.track.uri,
    explicit: item.track.explicit
  }));
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!accessToken;
}
