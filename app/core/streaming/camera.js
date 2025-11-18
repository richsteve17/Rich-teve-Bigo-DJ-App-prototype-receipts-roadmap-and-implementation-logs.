// camera.js
// Webcam streaming for DJ visual presence
// For BIGO/SUGO streaming with video overlay

/**
 * Camera Manager - Handle webcam streaming and overlay
 */
export class CameraManager {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.isActive = false;
  }

  /**
   * Initialize and start webcam
   * @returns {Promise<object>} Status object
   */
  async start() {
    if (this.isActive) {
      return { success: true, message: 'Camera already active' };
    }

    try {
      // Request camera permission and stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false // We handle audio separately through the mixer
      });

      // Create or get video element
      if (!this.videoElement) {
        this.videoElement = document.getElementById('camera-preview');
        if (!this.videoElement) {
          // Create video element if it doesn't exist
          this.videoElement = document.createElement('video');
          this.videoElement.id = 'camera-preview';
          this.videoElement.autoplay = true;
          this.videoElement.muted = true;
          this.videoElement.playsInline = true;

          // Add to page (hidden by default via CSS)
          document.body.appendChild(this.videoElement);
        }
      }

      // Attach stream to video element
      this.videoElement.srcObject = this.stream;
      this.videoElement.play();

      this.isActive = true;

      return {
        success: true,
        message: 'Camera started',
        stream: this.stream
      };
    } catch (err) {
      console.error('Camera start error:', err);

      let message = 'Camera access denied';
      if (err.name === 'NotFoundError') {
        message = 'No camera found';
      } else if (err.name === 'NotAllowedError') {
        message = 'Camera permission denied';
      } else if (err.name === 'NotReadableError') {
        message = 'Camera is in use by another app';
      }

      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Stop webcam stream
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.isActive = false;

    return {
      success: true,
      message: 'Camera stopped'
    };
  }

  /**
   * Toggle camera on/off
   */
  async toggle() {
    if (this.isActive) {
      return this.stop();
    } else {
      return await this.start();
    }
  }

  /**
   * Get camera stream for composition/recording
   */
  getStream() {
    return this.stream;
  }

  /**
   * Check if camera is active
   */
  isRunning() {
    return this.isActive;
  }

  /**
   * Switch camera (front/back on mobile)
   */
  async switchCamera() {
    if (!this.isActive) {
      return { success: false, error: 'Camera not active' };
    }

    // Determine current facing mode
    const videoTrack = this.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const currentFacing = settings.facingMode || 'user';
    const newFacing = currentFacing === 'user' ? 'environment' : 'user';

    // Stop current stream
    this.stop();

    // Start with new facing mode
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: newFacing
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      this.videoElement.play();

      this.isActive = true;

      return {
        success: true,
        message: `Switched to ${newFacing} camera`,
        facingMode: newFacing
      };
    } catch (err) {
      console.error('Camera switch error:', err);
      // Try to restart with original facing mode
      await this.start();

      return {
        success: false,
        error: 'Could not switch camera'
      };
    }
  }
}
