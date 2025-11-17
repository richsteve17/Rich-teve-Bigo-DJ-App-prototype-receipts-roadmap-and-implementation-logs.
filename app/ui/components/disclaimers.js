// disclaimers.js
// Honest, transparent messaging about feature limitations
// Because overpromising is worse than being upfront

/**
 * Honest disclaimers for various features
 * These are shown to users so they understand what the features can and cannot do
 */

export const DISCLAIMERS = {
  dmca: {
    title: 'DMCA Assessment - What It Is & Isn\'t',
    icon: '⚠️',
    type: 'warning',
    content: `
      <h4>What This Tool Does:</h4>
      <ul>
        <li>Flags tracks from major record labels</li>
        <li>Identifies explicit content</li>
        <li>Checks track popularity as a risk indicator</li>
        <li>Provides general guidance based on common knowledge</li>
      </ul>

      <h4>What This Tool Does NOT Do:</h4>
      <ul>
        <li><strong>It is NOT legal advice</strong></li>
        <li>It cannot guarantee you won't get DMCA'd</li>
        <li>It doesn't have access to licensing databases</li>
        <li>It can't predict platform-specific detection</li>
        <li>Green doesn't mean "100% safe" - it means "lower risk"</li>
      </ul>

      <h4>The Truth:</h4>
      <p><strong>Only you are responsible for copyright compliance.</strong> This tool helps you make informed decisions, but:</p>
      <ul>
        <li>Even "safe" tracks can get flagged if licensing changes</li>
        <li>Platforms use different detection systems</li>
        <li>Live streams have different rules than VODs</li>
        <li>Licensing varies by country</li>
      </ul>

      <h4>Best Practice:</h4>
      <p>Use music from verified streamer-safe sources like Pretzel Rocks, StreamBeats, or Epidemic Sound with proper licensing.</p>
    `
  },

  beatMatching: {
    title: 'Beat Matching & Sync - How It Works',
    icon: 'ℹ️',
    type: 'info',
    content: `
      <h4>What Auto-Sync Does:</h4>
      <ul>
        <li>Matches the BPM (tempo) of both decks</li>
        <li>Attempts to align the beat phase</li>
        <li>Works best with consistent 4/4 time signatures</li>
      </ul>

      <h4>Limitations:</h4>
      <ul>
        <li><strong>Not magic</strong> - it's an algorithm with imperfect results</li>
        <li>BPM detection can be off by ±2-5 BPM</li>
        <li>Phase alignment works ~80% of the time</li>
        <li>Complex music (jazz, classical) will confuse it</li>
        <li>Live/recorded mixes may have tempo drift</li>
      </ul>

      <h4>The Beat Match Indicator:</h4>
      <ul>
        <li><span style="color: #48bb78;">Green</span>: Beats are aligned within 50ms tolerance</li>
        <li><span style="color: #ed8936;">Yellow</span>: Close but may need manual adjustment</li>
        <li><span style="color: #f56565;">Red</span>: Out of sync - try again or nudge manually</li>
      </ul>

      <h4>Pro Tip:</h4>
      <p>Use your ears! The indicator is a guide, but human judgment is still the gold standard. Real DJs use sync as a starting point, then fine-tune by ear.</p>
    `
  },

  aiRecommendations: {
    title: 'AI Suggestions - How They Work',
    icon: '🤖',
    type: 'info',
    content: `
      <h4>What The AI Does:</h4>
      <ul>
        <li>Analyzes BPM, energy, key, and other audio features</li>
        <li>Uses harmonic mixing theory (Camelot wheel)</li>
        <li>Ranks tracks by compatibility score</li>
        <li>Suggests similar vibes and energy levels</li>
      </ul>

      <h4>What It Doesn't Do:</h4>
      <ul>
        <li><strong>It's not truly "AI"</strong> - it's algorithmic matching</li>
        <li>It doesn't understand context or crowd energy</li>
        <li>It can't read the room</li>
        <li>It doesn't know genre boundaries or cultural fit</li>
        <li>It won't make you a better DJ</li>
      </ul>

      <h4>How Matching Works:</h4>
      <ul>
        <li>40% weight on BPM similarity (±5 BPM is ideal)</li>
        <li>30% weight on energy level</li>
        <li>20% weight on harmonic key compatibility</li>
        <li>10% weight on genre/style similarity</li>
      </ul>

      <h4>The Reality:</h4>
      <p>These suggestions are a <strong>starting point</strong>, not gospel. A 95% match might sound terrible in your set, and a 60% match might be the perfect surprise track. Trust your taste.</p>
    `
  },

  bpmDetection: {
    title: 'BPM Detection - How Accurate Is It?',
    icon: '📊',
    type: 'info',
    content: `
      <h4>How It Works:</h4>
      <ul>
        <li>Analyzes audio for rhythmic patterns</li>
        <li>Uses onset detection (beat peak finding)</li>
        <li>Averages intervals between detected beats</li>
        <li>Normalizes to typical range (60-200 BPM)</li>
      </ul>

      <h4>Accuracy:</h4>
      <ul>
        <li><strong>Electronic music</strong>: 90-95% accurate</li>
        <li><strong>Hip-hop/Pop</strong>: 85-90% accurate</li>
        <li><strong>Rock/Live music</strong>: 70-80% accurate</li>
        <li><strong>Complex music</strong>: 50-70% accurate (jazz, classical, experimental)</li>
      </ul>

      <h4>Common Issues:</h4>
      <ul>
        <li>Can detect half-time or double-time (120 BPM might show as 60 or 240)</li>
        <li>Intros/outros without drums confuse it</li>
        <li>Tempo changes within a track aren't handled</li>
        <li>Heavy bass can mask the actual beat</li>
      </ul>

      <h4>What To Do:</h4>
      <p>If the BPM looks wrong, <strong>tap it out yourself</strong>. Count "1-2-3-4" with the beat for 15-30 seconds and calculate: (taps ÷ seconds) × 60 = BPM</p>
    `
  },

  demoMode: {
    title: 'Demo Mode - What You\'re Using',
    icon: '🎮',
    type: 'info',
    content: `
      <h4>What Is Demo Mode?</h4>
      <p>A fully functional DJ experience with preloaded tracks - no login or setup required!</p>

      <h4>What Works:</h4>
      <ul>
        <li>Full dual-deck mixer</li>
        <li>Beat matching and sync</li>
        <li>EQ and crossfader</li>
        <li>Waveform visualization</li>
        <li>Interactive tutorial</li>
      </ul>

      <h4>Limitations:</h4>
      <ul>
        <li>Only 8 demo tracks available (can't search Spotify)</li>
        <li>Can't upload your own files</li>
        <li>No AI recommendations (uses simple matching)</li>
        <li>Demo audio is simulated (not real track playback)</li>
      </ul>

      <h4>Why Demo Mode?</h4>
      <p>Perfect for learning and testing before committing to Spotify integration. Try all the features risk-free!</p>

      <h4>Ready for More?</h4>
      <p>Switch to <strong>Full Mode</strong> to unlock Spotify, AI suggestions, and advanced features. Or try <strong>Simple Mode</strong> for classic DJ basics.</p>
    `
  },

  simpleMode: {
    title: 'Simple Mode - Back to Basics',
    icon: '🎵',
    type: 'info',
    content: `
      <h4>What Is Simple Mode?</h4>
      <p>The original BIGO DJ experience - single deck, audio capture, and core fundamentals.</p>

      <h4>What's Included:</h4>
      <ul>
        <li>Single deck operation</li>
        <li>Audio capture from microphone</li>
        <li>Real-time spectrum visualization</li>
        <li>Basic BPM detection</li>
        <li>Local file upload</li>
        <li>Simple mixing controls</li>
      </ul>

      <h4>What's NOT Included:</h4>
      <ul>
        <li>No Spotify integration</li>
        <li>No AI suggestions</li>
        <li>No dual-deck mixing</li>
        <li>No advanced beat matching</li>
        <li>Simplified interface</li>
      </ul>

      <h4>Who Is This For?</h4>
      <p>Perfect for learners who want to focus on fundamentals without the complexity of professional features.</p>
    `
  },

  headphoneCueing: {
    title: 'Headphone Cueing - Coming Soon',
    icon: '🎧',
    type: 'warning',
    content: `
      <h4>What You Need:</h4>
      <p>Real DJs preview Deck B in their headphones before bringing it into the mix. This is essential for beatmatching.</p>

      <h4>Current Limitation:</h4>
      <p><strong>This feature is not yet implemented.</strong> Right now, both decks play through your main speakers.</p>

      <h4>The Challenge:</h4>
      <p>Web browsers have limited audio routing. Professional cueing requires:</p>
      <ul>
        <li>Multiple audio output devices</li>
        <li>Separate routing for preview vs. main output</li>
        <li>This is not yet supported in Web Audio API</li>
      </ul>

      <h4>Workaround:</h4>
      <ul>
        <li>Use volume faders to preview quietly</li>
        <li>Rely on waveform visualization</li>
        <li>Use sync for now, practice manual matching later</li>
      </ul>

      <h4>Future:</h4>
      <p>We're exploring solutions using the Web Audio API's ChannelSplitter and external audio interfaces. Stay tuned!</p>
    `
  },

  spotifyLimitations: {
    title: 'Spotify Integration - What to Expect',
    icon: '🎵',
    type: 'info',
    content: `
      <h4>Requirements:</h4>
      <ul>
        <li><strong>Spotify Premium required</strong> for Web Playback SDK</li>
        <li>Must authorize app with Spotify account</li>
        <li>Token expires after 1 hour (must re-login)</li>
      </ul>

      <h4>API Limitations:</h4>
      <ul>
        <li>Rate limited to 30 requests per second</li>
        <li>Search results limited to 50 tracks per query</li>
        <li>Audio features not available for all tracks</li>
        <li>Playback requires active Spotify Premium subscription</li>
      </ul>

      <h4>Playback Quirks:</h4>
      <ul>
        <li>Web Playback SDK has ~500ms latency</li>
        <li>Not ideal for precise beat matching</li>
        <li>Local files are better for critical timing</li>
        <li>Works great for browsing and planning sets</li>
      </ul>

      <h4>The Reality:</h4>
      <p>Spotify is <strong>amazing for discovery</strong> and track selection, but professional DJs use downloaded files for actual performance. Use Spotify to find tracks, then get high-quality files for your sets.</p>
    `
  }
};

/**
 * Show a disclaimer modal
 */
export function showDisclaimer(type) {
  const disclaimer = DISCLAIMERS[type];
  if (!disclaimer) {
    console.error('Unknown disclaimer type:', type);
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'disclaimer-modal';
  modal.innerHTML = `
    <div class="disclaimer-overlay"></div>
    <div class="disclaimer-content ${disclaimer.type}">
      <div class="disclaimer-header">
        <span class="disclaimer-icon">${disclaimer.icon}</span>
        <h3>${disclaimer.title}</h3>
        <button class="disclaimer-close">×</button>
      </div>
      <div class="disclaimer-body">
        ${disclaimer.content}
      </div>
      <div class="disclaimer-footer">
        <label>
          <input type="checkbox" id="dont-show-${type}">
          Don't show this again
        </label>
        <button class="btn-primary disclaimer-ok">Got It</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event handlers
  const close = () => {
    const dontShow = document.getElementById(`dont-show-${type}`).checked;
    if (dontShow) {
      localStorage.setItem(`disclaimer_hidden_${type}`, 'true');
    }
    modal.remove();
  };

  modal.querySelector('.disclaimer-close').addEventListener('click', close);
  modal.querySelector('.disclaimer-ok').addEventListener('click', close);
  modal.querySelector('.disclaimer-overlay').addEventListener('click', close);
}

/**
 * Check if disclaimer should be shown
 */
export function shouldShowDisclaimer(type) {
  return localStorage.getItem(`disclaimer_hidden_${type}`) !== 'true';
}

/**
 * Show disclaimer if not dismissed
 */
export function maybeShowDisclaimer(type, delay = 0) {
  if (shouldShowDisclaimer(type)) {
    setTimeout(() => showDisclaimer(type), delay);
  }
}

/**
 * Reset all disclaimers (for testing)
 */
export function resetDisclaimers() {
  Object.keys(DISCLAIMERS).forEach(type => {
    localStorage.removeItem(`disclaimer_hidden_${type}`);
  });
}

/**
 * Create inline warning badge
 */
export function createWarningBadge(text, disclaimerType) {
  const badge = document.createElement('button');
  badge.className = 'warning-badge';
  badge.innerHTML = `⚠️ ${text}`;
  badge.title = 'Click for details';
  badge.addEventListener('click', () => showDisclaimer(disclaimerType));
  return badge;
}

/**
 * Create info badge
 */
export function createInfoBadge(text, disclaimerType) {
  const badge = document.createElement('button');
  badge.className = 'info-badge';
  badge.innerHTML = `ℹ️ ${text}`;
  badge.title = 'Click for details';
  badge.addEventListener('click', () => showDisclaimer(disclaimerType));
  return badge;
}
