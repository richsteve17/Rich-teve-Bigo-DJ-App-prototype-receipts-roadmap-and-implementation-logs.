import { startRoom, stopRoom, getState, events } from '../../core/session/room.js';
import { listAudioDevices } from '../../core/audio/utils/audioHelpers.js';

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const deviceSelect = document.getElementById('deviceSelect');
const canvas = document.getElementById('scope');
const ctx = canvas.getContext('2d');

function log(line) {
  const ts = new Date().toISOString().split('T')[1].replace('Z','');
  logEl.textContent += `[${ts}] ${line}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(s) { statusEl.textContent = s; }

async function populateDevices() {
  const inputs = await listAudioDevices();
  deviceSelect.innerHTML = '';
  for (const d of inputs) {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `Mic ${deviceSelect.length + 1}`;
    deviceSelect.appendChild(opt);
  }
}

let rafId = null;
function startViz(analyser) {
  const bins = new Uint8Array(analyser.frequencyBinCount);
  function draw() {
    analyser.getByteFrequencyData(bins);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width / bins.length;
    for (let i = 0; i < bins.length; i++) {
      const h = (bins[i] / 255) * canvas.height;
      ctx.fillRect(i * w, canvas.height - h, w, h);
    }
    rafId = requestAnimationFrame(draw);
  }
  draw();
}
function stopViz() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// wire events
events.on('room:status', s => setStatus(s.status));
events.on('room:started', ({ id }) => log(`room started: ${id}`));
events.on('room:stopped', ({ durationMs }) => log(`room stopped: ${durationMs}ms`));
events.on('room:error', ({ error }) => log(`ERROR: ${error.message || error}`));

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  try {
    // TODO: pass selected deviceId in constraints when you extend initCapture
    const s = await startRoom({ deviceId: deviceSelect.value || null });
    log('capture initialized');
    const { analyser } = getState().audio || {};
    if (analyser) startViz(analyser);
    stopBtn.disabled = false;
  } catch (e) {
    log(`start failed: ${e.message || e}`);
    startBtn.disabled = false;
  }
});

stopBtn.addEventListener('click', async () => {
  stopBtn.disabled = true;
  await stopRoom();
  stopViz();
  startBtn.disabled = false;
});

// init
populateDevices().catch(() => log('could not list devices (permissions?)'));
setStatus(getState().status);