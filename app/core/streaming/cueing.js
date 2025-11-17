// cueing.js
// Cue system for previewing tracks before mixing
// Essential for BIGO/SUGO streaming where you can't use traditional headphones

/**
 * Cue System - Preview tracks before bringing them into the mix
 * Works with single-device setups common in mobile streaming
 */
export class CueSystem {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.cueGainA = audioContext.createGain();
    this.cueGainB = audioContext.createGain();
    this.masterGain = audioContext.createGain();

    // Cue output (low volume for preview)
    this.cueGainA.gain.value = 0.3;
    this.cueGainB.gain.value = 0.3;

    // Connect to master
    this.cueGainA.connect(this.masterGain);
    this.cueGainB.connect(this.masterGain);
    this.masterGain.connect(audioContext.destination);

    this.cueState = {
      A: false,
      B: false
    };
  }

  /**
   * Enable cue for a deck (preview mode)
   * @param {string} deck - 'A' or 'B'
   */
  enableCue(deck) {
    this.cueState[deck] = true;

    // Lower volume for preview
    const cueGain = deck === 'A' ? this.cueGainA : this.cueGainB;
    cueGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

    this._updateUI(deck, true);
  }

  /**
   * Disable cue (back to normal)
   * @param {string} deck - 'A' or 'B'
   */
  disableCue(deck) {
    this.cueState[deck] = false;

    // Return to normal volume
    const cueGain = deck === 'A' ? this.cueGainA : this.cueGainB;
    cueGain.gain.setValueAtTime(1.0, this.audioContext.currentTime);

    this._updateUI(deck, false);
  }

  /**
   * Toggle cue on/off
   * @param {string} deck - 'A' or 'B'
   */
  toggleCue(deck) {
    if (this.cueState[deck]) {
      this.disableCue(deck);
    } else {
      this.enableCue(deck);
    }
  }

  /**
   * Check if deck is in cue mode
   * @param {string} deck - 'A' or 'B'
   */
  isCued(deck) {
    return this.cueState[deck];
  }

  /**
   * Get cue gain node for deck
   * @param {string} deck - 'A' or 'B'
   */
  getCueGain(deck) {
    return deck === 'A' ? this.cueGainA : this.cueGainB;
  }

  /**
   * Update UI to show cue state
   */
  _updateUI(deck, active) {
    const btn = document.getElementById(`cue-${deck.toLowerCase()}`);
    if (btn) {
      if (active) {
        btn.classList.add('active');
        btn.textContent = `CUE ${deck} 🎧`;
      } else {
        btn.classList.remove('active');
        btn.textContent = `CUE ${deck}`;
      }
    }
  }

  /**
   * Split-cue mode for practicing
   * Deck A to left ear, Deck B to right ear (requires stereo split)
   */
  enableSplitCue() {
    // Create stereo splitter
    const splitter = this.audioContext.createChannelSplitter(2);
    const merger = this.audioContext.createChannelMerger(2);

    // A to left, B to right
    this.cueGainA.disconnect();
    this.cueGainB.disconnect();

    this.cueGainA.connect(merger, 0, 0); // Left channel
    this.cueGainB.connect(merger, 0, 1); // Right channel

    merger.connect(this.masterGain);

    return {
      enabled: true,
      note: 'Deck A = Left ear, Deck B = Right ear'
    };
  }
}

/**
 * Track Staging System - Pre-load next track
 */
export class TrackStaging {
  constructor() {
    this.stagedTrack = null;
    this.targetDeck = null;
  }

  /**
   * Stage a track for loading
   * @param {Object} track - Track to stage
   * @param {string} deck - Target deck ('A' or 'B')
   */
  stageTrack(track, deck) {
    this.stagedTrack = track;
    this.targetDeck = deck;

    this._updateStagingUI();

    return {
      track: track,
      targetDeck: deck,
      ready: true
    };
  }

  /**
   * Get staged track
   */
  getStagedTrack() {
    return {
      track: this.stagedTrack,
      deck: this.targetDeck
    };
  }

  /**
   * Clear staged track
   */
  clearStaged() {
    this.stagedTrack = null;
    this.targetDeck = null;
    this._updateStagingUI();
  }

  /**
   * Load staged track to its target deck
   */
  loadStaged(loadCallback) {
    if (this.stagedTrack && this.targetDeck) {
      loadCallback(this.stagedTrack, this.targetDeck);
      this.clearStaged();
      return true;
    }
    return false;
  }

  /**
   * Update staging area UI
   */
  _updateStagingUI() {
    const stagingArea = document.getElementById('staging-area');
    if (!stagingArea) return;

    if (this.stagedTrack) {
      stagingArea.innerHTML = `
        <div class="staged-track">
          <div class="staged-header">
            <span class="staged-badge">NEXT UP → DECK ${this.targetDeck}</span>
            <button id="clear-staged" class="btn-icon">×</button>
          </div>
          <div class="staged-info">
            <div class="staged-title">${this.stagedTrack.name}</div>
            <div class="staged-artist">${this.stagedTrack.artist}</div>
            <div class="staged-meta">
              <span>${this.stagedTrack.bpm || '--'} BPM</span>
              <span>${Math.floor((this.stagedTrack.duration || 0) / 60000)}:${String(Math.floor(((this.stagedTrack.duration || 0) % 60000) / 1000)).padStart(2, '0')}</span>
            </div>
          </div>
          <button id="load-staged" class="btn-load-staged">
            LOAD TO DECK ${this.targetDeck}
          </button>
        </div>
      `;

      // Add event listeners
      document.getElementById('clear-staged')?.addEventListener('click', () => {
        this.clearStaged();
      });

      document.getElementById('load-staged')?.addEventListener('click', () => {
        const event = new CustomEvent('load_staged', {
          detail: { track: this.stagedTrack, deck: this.targetDeck }
        });
        window.dispatchEvent(event);
      });
    } else {
      stagingArea.innerHTML = `
        <div class="staging-empty">
          <p>📋 No track staged</p>
          <p class="staging-hint">Click any track to prepare it for loading</p>
        </div>
      `;
    }
  }

  /**
   * Quick swap - stage track for opposite deck
   * If Deck A is playing, stage for Deck B and vice versa
   */
  autoStage(track, activeDeck) {
    const targetDeck = activeDeck === 'A' ? 'B' : 'A';
    return this.stageTrack(track, targetDeck);
  }
}
