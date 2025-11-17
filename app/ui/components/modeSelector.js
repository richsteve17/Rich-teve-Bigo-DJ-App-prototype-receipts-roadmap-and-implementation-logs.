// modeSelector.js
// Mode selection interface with clear explanations

import { AppMode } from '../../core/modes.js';

/**
 * Create and show mode selector modal
 */
export function showModeSelector(currentMode, onModeSelect) {
  const modal = document.createElement('div');
  modal.className = 'mode-selector-modal';
  modal.innerHTML = `
    <div class="mode-selector-overlay"></div>
    <div class="mode-selector-content">
      <div class="mode-selector-header">
        <h2>Choose Your Experience</h2>
        <p>Select the mode that fits your needs. You can switch anytime.</p>
      </div>

      <div class="mode-selector-grid">
        <!-- Demo Mode -->
        <div class="mode-card ${currentMode === AppMode.DEMO ? 'active' : ''}" data-mode="${AppMode.DEMO}">
          <div class="mode-icon">🎮</div>
          <h3>Demo Mode</h3>
          <p class="mode-tagline">Try everything, no setup required</p>

          <div class="mode-features">
            <h4>✅ What's Included:</h4>
            <ul>
              <li>8 preloaded demo tracks</li>
              <li>Full dual-deck mixer</li>
              <li>Beat matching & sync</li>
              <li>EQ & crossfader</li>
              <li>Interactive tutorial</li>
            </ul>
          </div>

          <div class="mode-limitations">
            <h4>⚠️ Limitations:</h4>
            <ul>
              <li>No Spotify search</li>
              <li>Can't upload files</li>
              <li>Limited track selection</li>
            </ul>
          </div>

          <button class="mode-select-btn" data-mode="${AppMode.DEMO}">
            ${currentMode === AppMode.DEMO ? 'Currently Active' : 'Select Demo Mode'}
          </button>
        </div>

        <!-- Simple Mode -->
        <div class="mode-card ${currentMode === AppMode.SIMPLE ? 'active' : ''}" data-mode="${AppMode.SIMPLE}">
          <div class="mode-icon">🎵</div>
          <h3>Simple Mode</h3>
          <p class="mode-tagline">Classic DJ basics, focus on fundamentals</p>

          <div class="mode-features">
            <h4>✅ What's Included:</h4>
            <ul>
              <li>Single deck operation</li>
              <li>Audio capture (mic input)</li>
              <li>Spectrum visualizer</li>
              <li>BPM detection</li>
              <li>Local file upload</li>
            </ul>
          </div>

          <div class="mode-limitations">
            <h4>⚠️ Limitations:</h4>
            <ul>
              <li>No Spotify</li>
              <li>No AI suggestions</li>
              <li>Single deck only</li>
              <li>Basic features only</li>
            </ul>
          </div>

          <button class="mode-select-btn" data-mode="${AppMode.SIMPLE}">
            ${currentMode === AppMode.SIMPLE ? 'Currently Active' : 'Select Simple Mode'}
          </button>
        </div>

        <!-- Full Mode -->
        <div class="mode-card featured ${currentMode === AppMode.FULL ? 'active' : ''}" data-mode="${AppMode.FULL}">
          <div class="mode-badge">RECOMMENDED</div>
          <div class="mode-icon">🚀</div>
          <h3>Full Mode</h3>
          <p class="mode-tagline">Professional DJ platform, all features unlocked</p>

          <div class="mode-features">
            <h4>✅ What's Included:</h4>
            <ul>
              <li>Full Spotify integration</li>
              <li>AI-powered suggestions</li>
              <li>Dual-deck mixing</li>
              <li>Advanced beat matching</li>
              <li>Streamer-safe filter</li>
              <li>Harmonic mixing</li>
              <li>Local file support</li>
              <li>Everything unlocked!</li>
            </ul>
          </div>

          <div class="mode-requirements">
            <h4>📋 Requirements:</h4>
            <ul>
              <li>Spotify account (Premium for playback)</li>
              <li>Spotify app authorization</li>
            </ul>
          </div>

          <button class="mode-select-btn primary" data-mode="${AppMode.FULL}">
            ${currentMode === AppMode.FULL ? 'Currently Active' : 'Select Full Mode'}
          </button>
        </div>
      </div>

      <div class="mode-selector-footer">
        <p>💡 You can change modes anytime from Settings</p>
        <button class="mode-selector-close">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event handlers
  const selectButtons = modal.querySelectorAll('.mode-select-btn');
  selectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode !== currentMode) {
        modal.remove();
        onModeSelect(mode);
      }
    });
  });

  modal.querySelector('.mode-selector-close').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('.mode-selector-overlay').addEventListener('click', () => {
    modal.remove();
  });
}

/**
 * Create mode indicator badge for header
 */
export function createModeIndicator(mode, onClick) {
  const badge = document.createElement('button');
  badge.className = 'mode-indicator';
  badge.id = 'mode-indicator';

  const icons = {
    [AppMode.DEMO]: '🎮',
    [AppMode.SIMPLE]: '🎵',
    [AppMode.FULL]: '🚀'
  };

  const names = {
    [AppMode.DEMO]: 'Demo',
    [AppMode.SIMPLE]: 'Simple',
    [AppMode.FULL]: 'Full'
  };

  badge.innerHTML = `
    <span class="mode-icon">${icons[mode]}</span>
    <span class="mode-name">${names[mode]} Mode</span>
    <span class="mode-arrow">▼</span>
  `;

  badge.title = 'Click to change mode';
  badge.addEventListener('click', onClick);

  return badge;
}

/**
 * Show mode change confirmation
 */
export function confirmModeChange(fromMode, toMode, onConfirm) {
  const modeNames = {
    [AppMode.DEMO]: 'Demo Mode',
    [AppMode.SIMPLE]: 'Simple Mode',
    [AppMode.FULL]: 'Full Mode'
  };

  const modal = document.createElement('div');
  modal.className = 'confirm-modal';
  modal.innerHTML = `
    <div class="confirm-overlay"></div>
    <div class="confirm-content">
      <div class="confirm-icon">⚠️</div>
      <h3>Switch to ${modeNames[toMode]}?</h3>
      <p>This will reload the interface with different features.</p>

      ${toMode === AppMode.FULL ? `
        <div class="confirm-note">
          <strong>Note:</strong> Full Mode requires Spotify login for best experience.
        </div>
      ` : ''}

      ${toMode === AppMode.SIMPLE ? `
        <div class="confirm-note">
          <strong>Note:</strong> Simple Mode is single-deck only with basic features.
        </div>
      ` : ''}

      ${toMode === AppMode.DEMO ? `
        <div class="confirm-note">
          <strong>Note:</strong> Demo Mode uses preloaded tracks only.
        </div>
      ` : ''}

      <div class="confirm-buttons">
        <button class="btn-secondary confirm-cancel">Cancel</button>
        <button class="btn-primary confirm-yes">Switch Mode</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.confirm-yes').addEventListener('click', () => {
    modal.remove();
    onConfirm();
  });

  modal.querySelector('.confirm-cancel').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('.confirm-overlay').addEventListener('click', () => {
    modal.remove();
  });
}

/**
 * Show first-time mode selection
 */
export function showFirstTimeSetup(onModeSelect) {
  const modal = document.createElement('div');
  modal.className = 'first-time-modal';
  modal.innerHTML = `
    <div class="first-time-overlay"></div>
    <div class="first-time-content">
      <div class="first-time-header">
        <h1>🎵 Welcome to BIGO DJ!</h1>
        <p>Let's get you started with the right experience</p>
      </div>

      <div class="first-time-options">
        <div class="first-time-option" data-mode="${AppMode.DEMO}">
          <div class="option-badge">QUICKSTART</div>
          <h3>🎮 Try Demo Mode</h3>
          <p>Jump right in! No setup, no login, just start mixing with preloaded tracks.</p>
          <button class="btn-primary" data-mode="${AppMode.DEMO}">Start Demo</button>
        </div>

        <div class="first-time-option featured" data-mode="${AppMode.FULL}">
          <div class="option-badge">RECOMMENDED</div>
          <h3>🚀 Full Experience</h3>
          <p>Get everything: Spotify, AI suggestions, advanced features. Requires Spotify account.</p>
          <button class="btn-primary" data-mode="${AppMode.FULL}">Set Up Full Mode</button>
        </div>

        <div class="first-time-option" data-mode="${AppMode.SIMPLE}">
          <h3>🎵 Simple Mode</h3>
          <p>Learn the basics with single-deck operation and core features.</p>
          <button class="btn-secondary" data-mode="${AppMode.SIMPLE}">Start Simple</button>
        </div>
      </div>

      <div class="first-time-footer">
        <p>Don't worry - you can switch modes anytime! 💡</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const buttons = modal.querySelectorAll('button[data-mode]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      modal.remove();
      onModeSelect(mode);
    });
  });
}
