// recording.js
// Mix recording system for capturing DJ sets
// Perfect for saving practice sessions or creating content

/**
 * Recording System - Capture master output
 * Records the final mix as audio file for later use
 */
export class MixRecorder {
  constructor(masterGainNode) {
    this.masterGain = masterGainNode;
    this.recorder = null;
    this.chunks = [];
    this.isRecording = false;
    this.startTime = null;
    this.duration = 0;
    this.stream = null;
  }

  /**
   * Start recording the mix
   */
  startRecording() {
    if (this.isRecording) return false;

    try {
      // Create media stream from master output
      const dest = this.masterGain.context.createMediaStreamDestination();
      this.masterGain.connect(dest);
      this.stream = dest.stream;

      // Create recorder
      const options = { mimeType: 'audio/webm;codecs=opus' };
      this.recorder = new MediaRecorder(this.stream, options);

      this.chunks = [];
      this.startTime = Date.now();

      // Collect data chunks
      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      // Handle stop
      this.recorder.onstop = () => {
        this._finalizeRecording();
      };

      // Start recording
      this.recorder.start(1000); // Capture in 1-second chunks
      this.isRecording = true;

      this._updateRecordingUI();

      return {
        success: true,
        message: 'Recording started'
      };
    } catch (err) {
      console.error('Recording error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.isRecording || !this.recorder) return false;

    this.recorder.stop();
    this.isRecording = false;
    this.duration = Date.now() - this.startTime;

    this._updateRecordingUI();

    return {
      success: true,
      duration: this.duration
    };
  }

  /**
   * Finalize recording and create download
   */
  _finalizeRecording() {
    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const duration = this.duration;

    // Show download UI
    this._showDownloadUI(url, duration, blob.size);

    // Auto-download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `BIGO-DJ-Mix-${timestamp}.webm`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /**
   * Show download UI with recording info
   */
  _showDownloadUI(url, duration, size) {
    const modal = document.createElement('div');
    modal.className = 'recording-complete-modal';
    modal.innerHTML = `
      <div class="recording-overlay"></div>
      <div class="recording-complete">
        <div class="recording-icon">🎵</div>
        <h3>Recording Complete!</h3>
        <div class="recording-stats">
          <div class="stat">
            <span class="stat-label">Duration</span>
            <span class="stat-value">${this._formatDuration(duration)}</span>
          </div>
          <div class="stat">
            <span class="stat-label">File Size</span>
            <span class="stat-value">${this._formatFileSize(size)}</span>
          </div>
        </div>
        <p>Your mix has been downloaded!</p>
        <div class="recording-actions">
          <button class="btn-secondary recording-close">Close</button>
          <a href="${url}" download="my-mix.webm" class="btn-primary">Download Again</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.recording-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.recording-overlay').addEventListener('click', () => {
      modal.remove();
    });

    // Auto-remove after 30 seconds
    setTimeout(() => modal.remove(), 30000);
  }

  /**
   * Update recording UI (button state, timer)
   */
  _updateRecordingUI() {
    const btn = document.getElementById('record-btn');
    const indicator = document.getElementById('recording-indicator');
    const timer = document.getElementById('recording-timer');

    if (!btn) return;

    if (this.isRecording) {
      btn.classList.add('recording');
      btn.innerHTML = '⏹ STOP REC';

      if (indicator) {
        indicator.style.display = 'flex';
        this._startTimer();
      }
    } else {
      btn.classList.remove('recording');
      btn.innerHTML = '⏺ RECORD';

      if (indicator) {
        indicator.style.display = 'none';
      }

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    }
  }

  /**
   * Start recording timer
   */
  _startTimer() {
    const timer = document.getElementById('recording-timer');
    if (!timer) return;

    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      timer.textContent = this._formatDuration(elapsed);
    }, 1000);
  }

  /**
   * Format duration (ms to MM:SS)
   */
  _formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Format file size
   */
  _formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Get recording status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? Date.now() - this.startTime : 0,
      chunks: this.chunks.length
    };
  }

  /**
   * Cancel recording without saving
   */
  cancelRecording() {
    if (this.recorder && this.isRecording) {
      this.recorder.stop();
      this.isRecording = false;
      this.chunks = [];
      this._updateRecordingUI();
      return true;
    }
    return false;
  }
}

/**
 * Level Meter - Visual feedback for recording levels
 */
export class LevelMeter {
  constructor(analyserNode, canvasElement) {
    this.analyser = analyserNode;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.isRunning = false;
    this.animationId = null;
  }

  /**
   * Start level meter visualization
   */
  start() {
    this.isRunning = true;
    this._draw();
  }

  /**
   * Stop level meter
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * Draw level meter
   */
  _draw() {
    if (!this.isRunning) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const level = average / 255;

    // Clear canvas
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Draw level bar
    const barWidth = width * level;

    // Color based on level
    let color;
    if (level < 0.6) {
      color = '#48bb78'; // Green
    } else if (level < 0.85) {
      color = '#ed8936'; // Orange
    } else {
      color = '#f56565'; // Red (clipping warning)
    }

    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, barWidth, height);

    // Draw peak indicator
    if (level > 0.9) {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(width - 5, 0, 5, height);
    }

    this.animationId = requestAnimationFrame(() => this._draw());
  }

  /**
   * Get current level (0.0 - 1.0)
   */
  getLevel() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return average / 255;
  }
}
