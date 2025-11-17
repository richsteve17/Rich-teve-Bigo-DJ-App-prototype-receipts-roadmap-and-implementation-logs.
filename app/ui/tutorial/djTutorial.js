// djTutorial.js
// Interactive mobile-first tutorial system for new DJs
// Teaches basic DJ skills with step-by-step guidance

/**
 * DJ Tutorial System
 * Progressive lessons for learning DJ fundamentals
 */
export class DJTutorial {
  constructor() {
    this.currentStep = 0;
    this.completedLessons = new Set();
    this.isActive = false;
    this.overlay = null;

    this.lessons = [
      {
        id: 'welcome',
        title: 'Welcome to DJing!',
        description: 'Learn the basics of mixing music like a pro',
        steps: [
          {
            target: '#deck-a',
            title: 'Meet Deck A',
            content: 'This is your first deck. You\'ll load and play tracks here.',
            action: 'highlight',
            mobilePosition: 'bottom'
          },
          {
            target: '#deck-b',
            title: 'Meet Deck B',
            content: 'This is your second deck. DJs use two decks to mix songs together.',
            action: 'highlight',
            mobilePosition: 'bottom'
          },
          {
            target: '#crossfader',
            title: 'The Crossfader',
            content: 'Slide this to blend between Deck A (left) and Deck B (right).',
            action: 'interact',
            task: 'Move the crossfader',
            mobilePosition: 'top'
          }
        ]
      },
      {
        id: 'loading-tracks',
        title: 'Loading Your First Track',
        description: 'Learn how to find and load music',
        steps: [
          {
            target: '#track-search',
            title: 'Search for Music',
            content: 'Use search to find tracks from Spotify or upload your own files.',
            action: 'highlight',
            mobilePosition: 'top'
          },
          {
            target: '#track-browser',
            title: 'Browse Tracks',
            content: 'Tap any track to preview it. Double-tap to load it to the active deck.',
            action: 'demo',
            mobilePosition: 'top'
          },
          {
            target: '#deck-a .play-button',
            title: 'Play Your Track',
            content: 'Hit the play button to start the music!',
            action: 'interact',
            task: 'Press play',
            mobilePosition: 'bottom'
          }
        ]
      },
      {
        id: 'bpm-basics',
        title: 'Understanding BPM',
        description: 'BPM (beats per minute) is crucial for mixing',
        steps: [
          {
            target: '#deck-a .bpm-display',
            title: 'BPM Display',
            content: 'BPM shows how fast a track is. House music is usually 120-130 BPM.',
            action: 'highlight',
            mobilePosition: 'bottom'
          },
          {
            target: '#suggestions-panel',
            title: 'Smart Suggestions',
            content: 'Our AI suggests tracks with matching BPM for smooth mixing!',
            action: 'highlight',
            mobilePosition: 'top'
          }
        ]
      },
      {
        id: 'beat-matching',
        title: 'Beat Matching 101',
        description: 'Sync two tracks to mix them seamlessly',
        steps: [
          {
            target: '#deck-b',
            title: 'Load Second Track',
            content: 'Load a suggested track to Deck B. Look for one with similar BPM!',
            action: 'interact',
            task: 'Load track to Deck B',
            mobilePosition: 'bottom'
          },
          {
            target: '#sync-button',
            title: 'Auto Sync',
            content: 'Press SYNC to automatically match the beats. Easy mode activated!',
            action: 'interact',
            task: 'Press SYNC',
            mobilePosition: 'bottom'
          },
          {
            target: '#deck-b .play-button',
            title: 'Start Deck B',
            content: 'Now play Deck B. Both tracks should be playing in sync!',
            action: 'interact',
            task: 'Play Deck B',
            mobilePosition: 'bottom'
          },
          {
            target: '#beat-match-indicator',
            title: 'Beat Match Indicator',
            content: 'When this is green, your beats are perfectly aligned!',
            action: 'highlight',
            mobilePosition: 'top'
          }
        ]
      },
      {
        id: 'your-first-mix',
        title: 'Your First Mix',
        description: 'Blend two tracks together smoothly',
        steps: [
          {
            target: '#crossfader',
            title: 'Mixing Time!',
            content: 'Slowly slide the crossfader from Deck A to Deck B.',
            action: 'interact',
            task: 'Move crossfader to center',
            mobilePosition: 'top'
          },
          {
            target: '#waveforms',
            title: 'Watch the Waveforms',
            content: 'The waveforms show you where drops and breaks happen. Mix during similar sections!',
            action: 'highlight',
            mobilePosition: 'middle'
          },
          {
            target: '#crossfader',
            title: 'Complete the Transition',
            content: 'Move the crossfader all the way to Deck B to complete your first mix!',
            action: 'interact',
            task: 'Crossfade to Deck B',
            mobilePosition: 'top'
          }
        ]
      },
      {
        id: 'eq-basics',
        title: 'Using EQ',
        description: 'Shape your sound with equalization',
        steps: [
          {
            target: '#deck-a .eq-section',
            title: 'EQ Controls',
            content: 'EQ lets you adjust Bass (Low), Mids, and Treble (High) frequencies.',
            action: 'highlight',
            mobilePosition: 'bottom'
          },
          {
            target: '#deck-a .eq-low',
            title: 'Bass Cut Technique',
            content: 'When mixing, try cutting the bass on the outgoing track. This is a DJ essential!',
            action: 'interact',
            task: 'Lower the bass',
            mobilePosition: 'bottom'
          },
          {
            target: '#deck-b .eq-low',
            title: 'Bass Swap',
            content: 'At the same time, boost the bass on the incoming track.',
            action: 'demo',
            mobilePosition: 'bottom'
          }
        ]
      },
      {
        id: 'streamer-safe',
        title: 'Streaming Safely',
        description: 'Avoid copyright strikes on Twitch/YouTube',
        steps: [
          {
            target: '#safety-indicator',
            title: 'Safety Indicator',
            content: 'This shows if a track is safe to use on stream. Red = avoid!',
            action: 'highlight',
            mobilePosition: 'top'
          },
          {
            target: '#filter-safe-only',
            title: 'Safe Mode',
            content: 'Enable "Streamer Safe Only" to filter risky tracks automatically.',
            action: 'interact',
            task: 'Enable safe mode',
            mobilePosition: 'top'
          },
          {
            target: '#suggestions-panel',
            title: 'Safe Suggestions',
            content: 'Our AI prioritizes streamer-safe music in your recommendations!',
            action: 'highlight',
            mobilePosition: 'top'
          }
        ]
      },
      {
        id: 'advanced-techniques',
        title: 'Advanced Techniques',
        description: 'Level up your DJ skills',
        steps: [
          {
            target: '#cue-points',
            title: 'Cue Points',
            content: 'Set cue points to jump to specific parts of a track instantly.',
            action: 'highlight',
            mobilePosition: 'bottom'
          },
          {
            target: '#loop-section',
            title: 'Looping',
            content: 'Create loops to extend sections and build tension in your mix.',
            action: 'highlight',
            mobilePosition: 'bottom'
          },
          {
            target: '#fx-panel',
            title: 'Effects',
            content: 'Add effects like echo, reverb, and filters for creative transitions.',
            action: 'highlight',
            mobilePosition: 'middle'
          }
        ]
      }
    ];

    this.loadProgress();
  }

  /**
   * Start tutorial from beginning or resume
   */
  start(lessonId = null) {
    this.isActive = true;

    const lesson = lessonId
      ? this.lessons.find(l => l.id === lessonId)
      : this.lessons[0];

    if (!lesson) return;

    this.currentLesson = lesson;
    this.currentStep = 0;

    this._showStep(lesson.steps[0]);
    this._emit('tutorial_started', { lesson });
  }

  /**
   * Show a specific step
   */
  _showStep(step) {
    // Remove previous overlay
    this._removeOverlay();

    // Create new overlay
    this.overlay = this._createOverlay(step);
    document.body.appendChild(this.overlay);

    // Highlight target element
    if (step.target) {
      const target = document.querySelector(step.target);
      if (target) {
        target.classList.add('tutorial-highlight');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    this._emit('step_shown', { step, stepIndex: this.currentStep });
  }

  /**
   * Create tutorial overlay
   */
  _createOverlay(step) {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.innerHTML = `
      <div class="tutorial-card ${this._getMobilePosition(step)}">
        <div class="tutorial-header">
          <h3>${step.title}</h3>
          <button class="tutorial-close">×</button>
        </div>
        <div class="tutorial-content">
          <p>${step.content}</p>
          ${step.task ? `<div class="tutorial-task">Task: ${step.task}</div>` : ''}
        </div>
        <div class="tutorial-footer">
          <div class="tutorial-progress">
            Step ${this.currentStep + 1} of ${this.currentLesson.steps.length}
          </div>
          <div class="tutorial-buttons">
            ${this.currentStep > 0 ? '<button class="tutorial-back">Back</button>' : ''}
            <button class="tutorial-next">${
              this.currentStep === this.currentLesson.steps.length - 1 ? 'Finish' : 'Next'
            }</button>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    overlay.querySelector('.tutorial-close').addEventListener('click', () => this.skip());
    overlay.querySelector('.tutorial-next')?.addEventListener('click', () => this.next());
    overlay.querySelector('.tutorial-back')?.addEventListener('click', () => this.previous());

    return overlay;
  }

  /**
   * Get mobile position class
   */
  _getMobilePosition(step) {
    return step.mobilePosition ? `position-${step.mobilePosition}` : 'position-bottom';
  }

  /**
   * Move to next step
   */
  next() {
    if (!this.currentLesson) return;

    this.currentStep++;

    if (this.currentStep >= this.currentLesson.steps.length) {
      this._completeLesson();
    } else {
      this._showStep(this.currentLesson.steps[this.currentStep]);
    }
  }

  /**
   * Move to previous step
   */
  previous() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._showStep(this.currentLesson.steps[this.currentStep]);
    }
  }

  /**
   * Skip current lesson
   */
  skip() {
    this._removeOverlay();
    this.isActive = false;
    this._emit('tutorial_skipped', { lesson: this.currentLesson });
  }

  /**
   * Complete current lesson
   */
  _completeLesson() {
    this.completedLessons.add(this.currentLesson.id);
    this._removeOverlay();
    this.isActive = false;

    this.saveProgress();
    this._emit('lesson_completed', {
      lesson: this.currentLesson,
      totalCompleted: this.completedLessons.size
    });

    // Show completion message
    this._showCompletionMessage();
  }

  /**
   * Show lesson completion message
   */
  _showCompletionMessage() {
    const nextLesson = this._getNextLesson();

    const message = document.createElement('div');
    message.className = 'tutorial-completion';
    message.innerHTML = `
      <div class="completion-card">
        <h2>Lesson Complete!</h2>
        <p>You finished: ${this.currentLesson.title}</p>
        ${nextLesson ? `
          <button class="start-next-lesson">Start Next: ${nextLesson.title}</button>
        ` : `
          <p>You've completed all lessons! You're ready to DJ!</p>
        `}
        <button class="close-completion">Close</button>
      </div>
    `;

    document.body.appendChild(message);

    message.querySelector('.close-completion').addEventListener('click', () => {
      message.remove();
    });

    if (nextLesson) {
      message.querySelector('.start-next-lesson').addEventListener('click', () => {
        message.remove();
        this.start(nextLesson.id);
      });
    }

    setTimeout(() => message.remove(), 10000);
  }

  /**
   * Get next uncompleted lesson
   */
  _getNextLesson() {
    return this.lessons.find(lesson => !this.completedLessons.has(lesson.id));
  }

  /**
   * Get all available lessons
   */
  getLessons() {
    return this.lessons.map(lesson => ({
      ...lesson,
      completed: this.completedLessons.has(lesson.id),
      progress: this.completedLessons.has(lesson.id) ? 100 : 0
    }));
  }

  /**
   * Get tutorial progress
   */
  getProgress() {
    return {
      completed: this.completedLessons.size,
      total: this.lessons.length,
      percent: Math.round((this.completedLessons.size / this.lessons.length) * 100)
    };
  }

  /**
   * Remove tutorial overlay
   */
  _removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    // Remove all highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    const progress = {
      completedLessons: Array.from(this.completedLessons),
      lastUpdated: Date.now()
    };
    localStorage.setItem('dj_tutorial_progress', JSON.stringify(progress));
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    const stored = localStorage.getItem('dj_tutorial_progress');
    if (stored) {
      try {
        const progress = JSON.parse(stored);
        this.completedLessons = new Set(progress.completedLessons);
      } catch (err) {
        console.error('Failed to load tutorial progress:', err);
      }
    }
  }

  /**
   * Reset tutorial progress
   */
  reset() {
    this.completedLessons.clear();
    this.currentStep = 0;
    this.currentLesson = null;
    localStorage.removeItem('dj_tutorial_progress');
  }

  /**
   * Event system
   */
  _emit(event, data) {
    window.dispatchEvent(new CustomEvent(`tutorial:${event}`, { detail: data }));
  }

  on(event, callback) {
    window.addEventListener(`tutorial:${event}`, e => callback(e.detail));
  }
}
