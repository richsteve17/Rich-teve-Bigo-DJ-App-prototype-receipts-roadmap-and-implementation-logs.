// demoTracks.js
// Preloaded royalty-free demo tracks for Demo Mode
// All tracks are safe for streaming and learning

/**
 * Demo Track Library
 * These are placeholder tracks with realistic metadata for testing.
 * In production, you would replace preview URLs with actual royalty-free music.
 *
 * Suggested sources for real demo tracks:
 * - Pretzel Rocks (https://www.pretzel.rocks/)
 * - StreamBeats by Harris Heller
 * - NCS (NoCopyrightSounds)
 * - Chillhop Music
 * - Free Music Archive (FMA)
 */

export const DEMO_TRACKS = [
  {
    id: 'demo_1',
    name: 'Sunset Drive',
    artist: 'Demo Artist',
    album: 'Demo Collection Vol. 1',
    albumArt: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ff6b6b" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EDemo%3C/text%3E%3C/svg%3E',
    duration: 180000, // 3 minutes in ms
    bpm: 120,
    energy: 0.7,
    danceability: 0.8,
    valence: 0.6,
    key: 0, // C major
    mode: 1, // Major
    explicit: false,
    popularity: 75,
    source: 'demo',
    genre: 'House',
    features: {
      bpm: 120,
      energy: 0.7,
      danceability: 0.8,
      valence: 0.6,
      key: 0,
      mode: 1
    }
  },
  {
    id: 'demo_2',
    name: 'Neon Nights',
    artist: 'Demo Artist',
    album: 'Demo Collection Vol. 1',
    albumArt: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%2300d9ff" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EDemo%3C/text%3E%3C/svg%3E',
    duration: 210000,
    bpm: 128,
    energy: 0.8,
    danceability: 0.85,
    valence: 0.7,
    key: 7, // G major
    mode: 1,
    explicit: false,
    popularity: 80,
    source: 'demo',
    genre: 'House',
    features: {
      bpm: 128,
      energy: 0.8,
      danceability: 0.85,
      valence: 0.7,
      key: 7,
      mode: 1
    }
  },
  {
    id: 'demo_3',
    name: 'Chill Vibes',
    artist: 'Demo Artist',
    album: 'Demo Collection Vol. 2',
    albumArt: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%237000ff" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EDemo%3C/text%3E%3C/svg%3E',
    duration: 195000,
    bpm: 90,
    energy: 0.4,
    danceability: 0.6,
    valence: 0.5,
    key: 5, // F major
    mode: 1,
    explicit: false,
    popularity: 60,
    source: 'demo',
    genre: 'Chillout',
    features: {
      bpm: 90,
      energy: 0.4,
      danceability: 0.6,
      valence: 0.5,
      key: 5,
      mode: 1
    }
  },
  {
    id: 'demo_4',
    name: 'Electric Dreams',
    artist: 'Demo Artist',
    album: 'Demo Collection Vol. 2',
    albumArt: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ff006e" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EDemo%3C/text%3E%3C/svg%3E',
    duration: 240000,
    bpm: 125,
    energy: 0.75,
    danceability: 0.8,
    valence: 0.65,
    key: 2, // D major
    mode: 1,
    explicit: false,
    popularity: 85,
    source: 'demo',
    genre: 'Electronic',
    features: {
      bpm: 125,
      energy: 0.75,
      danceability: 0.8,
      valence: 0.65,
      key: 2,
      mode: 1
    }
  },
  {
    id: 'demo_5',
    name: 'Bass Drop',
    artist: 'Demo Artist',
    album: 'Demo Collection Vol. 3',
    albumArt: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f59e0b" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EDemo%3C/text%3E%3C/svg%3E',
    duration: 200000,
    bpm: 140,
    energy: 0.9,
    danceability: 0.85,
    valence: 0.75,
    key: 9, // A major
    mode: 1,
    explicit: false,
    popularity: 90,
    source: 'demo',
    genre: 'Dubstep',
    features: {
      bpm: 140,
      energy: 0.9,
      danceability: 0.85,
      valence: 0.75,
      key: 9,
      mode: 1
    }
  },
  {
    id: 'demo_6',
    name: 'Morning Coffee',
    artist: 'Demo Artist',
    album: 'Demo Collection Vol. 3',
    albumArt: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%2310b981" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EDemo%3C/text%3E%3C/svg%3E',
    duration: 165000,
    bpm: 85,
    energy: 0.3,
    danceability: 0.5,
    valence: 0.6,
    key: 4, // E major
    mode: 1,
    explicit: false,
    popularity: 55,
    source: 'demo',
    genre: 'Lofi',
    features: {
      bpm: 85,
      energy: 0.3,
      danceability: 0.5,
      valence: 0.6,
      key: 4,
      mode: 1
    }
  },
  {
    id: 'demo_7',
    name: 'Peak Hour',
    artist: 'Demo Artist',
    album: 'Demo Collection Vol. 4',
    albumArt: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ef4444" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EDemo%3C/text%3E%3C/svg%3E',
    duration: 220000,
    bpm: 130,
    energy: 0.85,
    danceability: 0.9,
    valence: 0.8,
    key: 1, // C# major
    mode: 1,
    explicit: false,
    popularity: 88,
    source: 'demo',
    genre: 'Techno',
    features: {
      bpm: 130,
      energy: 0.85,
      danceability: 0.9,
      valence: 0.8,
      key: 1,
      mode: 1
    }
  },
  {
    id: 'demo_8',
    name: 'Smooth Groove',
    artist: 'Demo Artist',
    album: 'Demo Collection Vol. 4',
    albumArt: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%238b5cf6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EDemo%3C/text%3E%3C/svg%3E',
    duration: 190000,
    bpm: 110,
    energy: 0.6,
    danceability: 0.75,
    valence: 0.55,
    key: 11, // B major
    mode: 1,
    explicit: false,
    popularity: 70,
    source: 'demo',
    genre: 'Deep House',
    features: {
      bpm: 110,
      energy: 0.6,
      danceability: 0.75,
      valence: 0.55,
      key: 11,
      mode: 1
    }
  }
];

/**
 * Get all demo tracks
 */
export function getDemoTracks() {
  return DEMO_TRACKS;
}

/**
 * Get demo track by ID
 */
export function getDemoTrack(id) {
  return DEMO_TRACKS.find(track => track.id === id);
}

/**
 * Search demo tracks
 */
export function searchDemoTracks(query) {
  const lowerQuery = query.toLowerCase();
  return DEMO_TRACKS.filter(track =>
    track.name.toLowerCase().includes(lowerQuery) ||
    track.artist.toLowerCase().includes(lowerQuery) ||
    track.genre.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get demo tracks by BPM range
 */
export function getDemoTracksByBPM(minBpm, maxBpm) {
  return DEMO_TRACKS.filter(track =>
    track.bpm >= minBpm && track.bpm <= maxBpm
  );
}

/**
 * Get demo tracks by genre
 */
export function getDemoTracksByGenre(genre) {
  return DEMO_TRACKS.filter(track =>
    track.genre.toLowerCase() === genre.toLowerCase()
  );
}

/**
 * Generate mock audio for demo mode
 * Creates a simple tone for playback simulation
 */
export function generateDemoAudio(track, audioContext) {
  // Create a simple oscillator for demo purposes
  // In production, you'd load actual audio files
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 440; // A4 note

  gainNode.gain.value = 0.1; // Low volume

  oscillator.connect(gainNode);

  return {
    oscillator,
    gainNode,
    duration: track.duration / 1000 // Convert to seconds
  };
}
