// env.template.js
// Copy this file to env.js and fill in the secrets that must NOT be committed.
// env.js is ignored via .gitignore and is loaded before config.js at runtime.

window.__DJ_APP_ENV__ = Object.freeze({
  // Spotify application Client ID generated from https://developer.spotify.com/dashboard
  // Never commit a real Client ID. Create a new one for production deployments.
  SPOTIFY_CLIENT_ID: 'your-spotify-client-id-goes-here'
});
