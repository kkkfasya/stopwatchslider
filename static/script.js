const MAX_MS = 1_800_000;

const display = document.getElementById('display');
const root = document.querySelector('.stopwatch');
const toggleBtn = document.getElementById('toggle');
const resetBtn = document.getElementById('reset');
const seek = document.getElementById('seek');
const seekValue = document.getElementById('seekValue');

const state = {
  running: false,
  anchor: 0,
  anchorTime: 0,
  scrubbing: false,
  frame: 0,
};

function now() {
  return performance.now();
}

function elapsed() {
  return state.anchor + (state.running ? now() - state.anchorTime : 0);
}

function format(ms) {
  const clamped = Math.max(0, ms);
  const minutes = Math.floor(clamped / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  const hundredths = Math.floor((clamped % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function render() {
  const ms = Math.min(elapsed(), MAX_MS);
  display.textContent = format(ms);
  seekValue.textContent = `${(ms / 1000).toFixed(2)}s`;

  if (!state.scrubbing) {
    seek.value = String(ms / 1000);
  }
  seek.style.setProperty('--fill', `${(ms / MAX_MS) * 100}%`);

  if (state.running && ms >= MAX_MS) {
    pause();
    state.anchor = MAX_MS;
  }
}

function tick() {
  render();
  if (state.running) {
    state.frame = requestAnimationFrame(tick);
  }
}

function play() {
  if (state.running) return;
  if (state.anchor >= MAX_MS) {
    state.anchor = 0;
  }
  state.anchorTime = now();
  state.running = true;
  toggleBtn.textContent = 'Pause';
  root.classList.add('is-running');
  state.frame = requestAnimationFrame(tick);
}

function pause() {
  if (!state.running) return;
  state.anchor = elapsed();
  state.running = false;
  cancelAnimationFrame(state.frame);
  toggleBtn.textContent = 'Start';
  root.classList.remove('is-running');
  render();
}

function toggle() {
  state.running ? pause() : play();
}

function reset() {
  pause();
  state.anchor = 0;
  render();
}

function scrubTo(seconds) {
  state.anchor = Math.min(Math.max(seconds * 1000, 0), MAX_MS);
  state.anchorTime = now();
  render();
}

toggleBtn.addEventListener('click', toggle);
resetBtn.addEventListener('click', reset);

seek.addEventListener('input', (event) => {
  scrubTo(Number(event.target.value));
});

seek.addEventListener('pointerdown', () => {
  state.scrubbing = true;
});

function endScrub() {
  if (!state.scrubbing) return;
  state.scrubbing = false;
  render();
}

window.addEventListener('pointerup', endScrub);
window.addEventListener('pointercancel', endScrub);

document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat) return;
  const tag = event.target.tagName;
  if (tag === 'BUTTON' || tag === 'INPUT') return;
  event.preventDefault();
  toggle();
});

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() !== 'r' || event.repeat) return;
  const tag = event.target.tagName;
  if (tag === 'INPUT' || event.metaKey || event.ctrlKey || event.altKey) return;
  reset();
});

render();