// beatMatching.js
// Beat matching and tempo synchronization for DJ mixing
// Handles BPM sync, phase alignment, and automatic beat matching

import { BeatGrid } from '../audio/bpmDetector.js';

/**
 * Beat Matcher - Synchronizes two decks for seamless mixing
 */
export class BeatMatcher {
  constructor(deckA, deckB) {
    this.deckA = deckA;
    this.deckB = deckB;
    this.beatGridA = null;
    this.beatGridB = null;
    this.isSynced = false;
    this.syncMode = 'manual'; // manual | auto
  }

  /**
   * Initialize beat grids for both decks
   */
  initBeatGrids(bpmA, bpmB, offsetA = 0, offsetB = 0) {
    this.beatGridA = new BeatGrid(bpmA, offsetA);
    this.beatGridB = new BeatGrid(bpmB, offsetB);
  }

  /**
   * Sync deck B to deck A's tempo
   */
  syncTempo() {
    if (!this.beatGridA || !this.beatGridB) {
      console.warn('Beat grids not initialized');
      return false;
    }

    const targetBPM = this.beatGridA.bpm;
    this.beatGridB.setBPM(targetBPM);

    // Calculate playback rate adjustment for deck B
    const originalBPM = this.deckB.bpm;
    const playbackRate = targetBPM / originalBPM;

    // Apply tempo adjustment (if supported by player)
    if (this.deckB.setPlaybackRate) {
      this.deckB.setPlaybackRate(playbackRate);
    }

    this.isSynced = true;
    return true;
  }

  /**
   * Align beats (phase sync)
   * Adjusts deck B's phase to match deck A's beat grid
   */
  async alignBeats(deckATime, deckBTime) {
    if (!this.beatGridA || !this.beatGridB) {
      console.warn('Beat grids not initialized');
      return false;
    }

    // Get nearest beat times
    const nearestBeatA = this.beatGridA.getNearestBeatTime(deckATime);
    const nearestBeatB = this.beatGridB.getNearestBeatTime(deckBTime);

    // Calculate phase offset
    const phaseOffset = nearestBeatA - nearestBeatB;

    // Adjust deck B's beat grid offset
    this.beatGridB.setOffset(this.beatGridB.offset + phaseOffset);

    // If player supports seeking, nudge to align
    const nextBeatA = this.beatGridA.getNextBeatTime(deckATime);
    const nextBeatB = this.beatGridB.getNextBeatTime(deckBTime);
    const timeDiff = nextBeatA - nextBeatB;

    if (Math.abs(timeDiff) > 0.05 && this.deckB.seek) {
      // Nudge deck B forward or backward
      await this.deckB.seek(deckBTime + timeDiff);
    }

    return true;
  }

  /**
   * Auto-sync both tempo and phase
   */
  async autoSync(deckATime, deckBTime) {
    this.syncTempo();
    await this.alignBeats(deckATime, deckBTime);
    this.syncMode = 'auto';
    return true;
  }

  /**
   * Calculate beat match quality (0.0 - 1.0)
   */
  getBeatMatchQuality(deckATime, deckBTime) {
    if (!this.beatGridA || !this.beatGridB) return 0;

    // Check tempo match
    const bpmDiff = Math.abs(this.beatGridA.bpm - this.beatGridB.bpm);
    const tempoScore = Math.max(0, 1 - (bpmDiff / 10)); // Perfect if within 10 BPM

    // Check phase match
    const beatA = this.beatGridA.getBeatAt(deckATime);
    const beatB = this.beatGridB.getBeatAt(deckBTime);
    const phaseDiff = Math.abs((beatA % 1) - (beatB % 1));
    const phaseScore = Math.max(0, 1 - phaseDiff);

    // Weighted average
    return (tempoScore * 0.6) + (phaseScore * 0.4);
  }

  /**
   * Get sync status
   */
  getSyncStatus(deckATime, deckBTime) {
    const quality = this.getBeatMatchQuality(deckATime, deckBTime);

    return {
      synced: this.isSynced,
      mode: this.syncMode,
      quality: quality,
      qualityPercent: Math.round(quality * 100),
      bpmA: this.beatGridA?.bpm || 0,
      bpmB: this.beatGridB?.bpm || 0,
      bpmDiff: Math.abs((this.beatGridA?.bpm || 0) - (this.beatGridB?.bpm || 0))
    };
  }

  /**
   * Disable sync
   */
  unsync() {
    this.isSynced = false;
    this.syncMode = 'manual';
  }

  /**
   * Nudge deck forward (for manual beat matching)
   */
  nudgeForward(deck, amountMs = 10) {
    const targetDeck = deck === 'A' ? this.deckA : this.deckB;
    const currentTime = targetDeck.getCurrentTime ? targetDeck.getCurrentTime() : 0;
    if (targetDeck.seek) {
      targetDeck.seek(currentTime + (amountMs / 1000));
    }
  }

  /**
   * Nudge deck backward
   */
  nudgeBackward(deck, amountMs = 10) {
    const targetDeck = deck === 'A' ? this.deckA : this.deckB;
    const currentTime = targetDeck.getCurrentTime ? targetDeck.getCurrentTime() : 0;
    if (targetDeck.seek) {
      targetDeck.seek(Math.max(0, currentTime - (amountMs / 1000)));
    }
  }

  /**
   * Tap tempo - detect BPM by tapping
   */
  tapTempo() {
    this.tapTimes = this.tapTimes || [];
    const now = Date.now();

    this.tapTimes.push(now);

    // Keep only last 8 taps
    if (this.tapTimes.length > 8) {
      this.tapTimes.shift();
    }

    // Need at least 2 taps to calculate
    if (this.tapTimes.length < 2) return null;

    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < this.tapTimes.length; i++) {
      intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    }

    // Average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Convert to BPM
    const bpm = Math.round(60000 / avgInterval);

    return bpm;
  }

  /**
   * Reset tap tempo
   */
  resetTapTempo() {
    this.tapTimes = [];
  }
}

/**
 * Crossfader - Controls volume blend between two decks
 */
export class Crossfader {
  constructor(deckAGainNode, deckBGainNode) {
    this.deckAGain = deckAGainNode;
    this.deckBGain = deckBGainNode;
    this.position = 0; // -1 (full A) to +1 (full B)
    this.curve = 'linear'; // linear | constant-power | cut
  }

  /**
   * Set crossfader position
   * @param {number} position - -1 (full A) to +1 (full B)
   */
  setPosition(position) {
    this.position = Math.max(-1, Math.min(1, position));

    const { gainA, gainB } = this._calculateGains(this.position);

    this.deckAGain.gain.value = gainA;
    this.deckBGain.gain.value = gainB;
  }

  /**
   * Calculate gain values based on curve type
   */
  _calculateGains(position) {
    // Normalize position to 0-1 range
    const normalized = (position + 1) / 2;

    switch (this.curve) {
      case 'constant-power':
        // Constant power crossfade (sounds more natural)
        return {
          gainA: Math.cos(normalized * Math.PI / 2),
          gainB: Math.sin(normalized * Math.PI / 2)
        };

      case 'cut':
        // Hard cut at center
        return {
          gainA: position < 0 ? 1 : 0,
          gainB: position > 0 ? 1 : 0
        };

      case 'linear':
      default:
        // Linear crossfade
        return {
          gainA: 1 - normalized,
          gainB: normalized
        };
    }
  }

  /**
   * Set crossfader curve type
   */
  setCurve(curve) {
    if (['linear', 'constant-power', 'cut'].includes(curve)) {
      this.curve = curve;
      this.setPosition(this.position); // Recalculate gains
    }
  }

  /**
   * Get current position
   */
  getPosition() {
    return this.position;
  }

  /**
   * Center the crossfader (50/50 mix)
   */
  center() {
    this.setPosition(0);
  }

  /**
   * Move to deck A
   */
  toA() {
    this.setPosition(-1);
  }

  /**
   * Move to deck B
   */
  toB() {
    this.setPosition(1);
  }
}

/**
 * Auto DJ - Automatically mix tracks based on beat matching
 */
export class AutoDJ {
  constructor(deckA, deckB, beatMatcher, crossfader) {
    this.deckA = deckA;
    this.deckB = deckB;
    this.beatMatcher = beatMatcher;
    this.crossfader = crossfader;
    this.isActive = false;
    this.currentDeck = 'A';
    this.transitionDuration = 16; // Transition over 16 beats (4 bars)
  }

  /**
   * Start Auto DJ mode
   */
  async start() {
    this.isActive = true;
    this.monitorPlayback();
  }

  /**
   * Stop Auto DJ mode
   */
  stop() {
    this.isActive = false;
  }

  /**
   * Monitor playback and trigger transitions
   */
  async monitorPlayback() {
    if (!this.isActive) return;

    const currentDeck = this.currentDeck === 'A' ? this.deckA : this.deckB;
    const nextDeck = this.currentDeck === 'A' ? this.deckB : this.deckA;

    // Check if current track is near end
    const timeRemaining = currentDeck.getDuration() - currentDeck.getCurrentTime();

    // Start transition 32 beats before end
    const beatsRemaining = (timeRemaining / 60) * currentDeck.bpm;

    if (beatsRemaining <= 32 && !nextDeck.isPlaying) {
      await this.transition();
    }

    // Check again in 1 second
    setTimeout(() => this.monitorPlayback(), 1000);
  }

  /**
   * Execute automatic transition between decks
   */
  async transition() {
    const currentDeck = this.currentDeck === 'A' ? this.deckA : this.deckB;
    const nextDeck = this.currentDeck === 'A' ? this.deckB : this.deckA;

    // Sync beats
    await this.beatMatcher.autoSync(
      currentDeck.getCurrentTime(),
      nextDeck.getCurrentTime()
    );

    // Start next deck
    await nextDeck.play();

    // Crossfade over transition duration
    const startPosition = this.currentDeck === 'A' ? -1 : 1;
    const endPosition = this.currentDeck === 'A' ? 1 : -1;
    const steps = 100;
    const stepDuration = (this.transitionDuration * 60 / currentDeck.bpm * 1000) / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const position = startPosition + (endPosition - startPosition) * progress;
      this.crossfader.setPosition(position);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }

    // Stop previous deck
    await currentDeck.pause();

    // Switch current deck
    this.currentDeck = this.currentDeck === 'A' ? 'B' : 'A';
  }

  /**
   * Set transition duration in beats
   */
  setTransitionDuration(beats) {
    this.transitionDuration = beats;
  }
}
