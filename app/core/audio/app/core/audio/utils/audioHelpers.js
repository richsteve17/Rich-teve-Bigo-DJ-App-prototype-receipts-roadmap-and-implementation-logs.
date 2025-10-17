// audioHelpers.js
// Utility layer for mic access, stream validation, and device info.

export async function getUserMedia(constraints) {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaDevices API not supported in this environment.');
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (err) {
    console.error('getUserMedia error:', err);
    throw err;
  }
}

export function listAudioDevices() {
  return navigator.mediaDevices.enumerateDevices()
    .then(devices => devices.filter(d => d.kind === 'audioinput'))
    .catch(err => {
      console.error('Device enumeration failed:', err);
      return [];
    });
}