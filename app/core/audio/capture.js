// capture.js
// Core audio capture module for BIGO DJ App
// Initializes mic input, analyzes BPM, and handles EQ data streaming.

import { getUserMedia } from './utils/audioHelpers.js';

export async function initCapture() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);

    // Basic EQ + BPM placeholder
    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);

    console.log('Audio capture initialized.');
    return { stream, audioCtx, analyser };
  } catch (err) {
    console.error('Audio capture failed:', err);
    throw err;
  }
}