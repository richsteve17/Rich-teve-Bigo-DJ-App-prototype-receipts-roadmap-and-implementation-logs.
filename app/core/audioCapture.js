// app/core/audioCapture.js
// BIGO DJ App Prototype - Audio Capture Module
// Author: Rich $teve

export async function initAudioCapture() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    source.connect(analyser);

    console.log('Audio capture initialized.');
    return { audioContext, analyser, stream };
  } catch (err) {
    console.error('Audio capture failed:', err);
    throw err;
  }
}

export function getBPMFromAnalyser(analyser) {
  const buffer = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buffer);
  const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length;
  const bpmEstimate = Math.round((avg / 255) * 180);
  return bpmEstimate;
}