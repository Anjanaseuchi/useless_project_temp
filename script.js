// ---- State ----
let isCharging = false;
let lastInteraction = 0;
let lastPlayed = 0;
let offenseCount = 0;

const sounds = [
  "audio/scold1.mp3",
  "audio/scold2.mp3",
  "audio/scold3.mp3",
];

// ---- Elements ----
const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const statusPanel = document.getElementById('statusPanel');
const countEl = document.getElementById('count');
const historyText = document.getElementById('historyText');
const celebration = document.getElementById('celebration');

// ---- Load history from localStorage ----
function loadHistory() {
  const total = localStorage.getItem('totalOffenses') || 0;
  historyText.innerText = `All-time offenses: ${total}`;
}
loadHistory();

// ---- Start charging session ----
startBtn.addEventListener('click', () => {
  isCharging = true;
  offenseCount = 0;
  countEl.innerText = offenseCount;
  statusPanel.classList.remove('hidden');
  celebration.classList.add('hidden');
  startBtn.classList.add('hidden');

  // Unlock audio for mobile browsers: play muted on this same tap gesture
  const unlock = new Audio(sounds[0]);
  unlock.volume = 0;
  unlock.play().then(() => unlock.pause()).catch(() => {});
});

// ---- End charging session ----
endBtn.addEventListener('click', () => {
  isCharging = false;
  statusPanel.classList.add('hidden');
  startBtn.classList.remove('hidden');
  celebration.classList.remove('hidden');

  const celebrateSound = new Audio("audio/celebrate.mp3");
  celebrateSound.play().catch(() => {});

  const total = parseInt(localStorage.getItem('totalOffenses') || 0);
  localStorage.setItem('totalOffenses', total + offenseCount);
  loadHistory();
});

// ---- Track user interaction ----
['touchstart', 'pointerdown', 'click', 'scroll'].forEach(evt =>
  window.addEventListener(evt, () => lastInteraction = Date.now())
);

// ---- Check periodically: were they just touching it? ----
function maybeScold() {
  if (!isCharging) return;
  const now = Date.now();

  if (now - lastInteraction < 1200 && now - lastPlayed > 5000) {
    const clip = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = new Audio(clip);
    audio.play().catch(() => {});
    lastPlayed = now;
    offenseCount++;
    countEl.innerText = offenseCount;
  }
}

setInterval(maybeScold, 1000);