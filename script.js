// ==========================================
// CHARGER GUILT - Battery Aware Version
// ==========================================

// ---------- State ----------
let isCharging = false;
let lastInteraction = 0;
let lastPlayed = 0;
let offenseCount = 0;
let currentAudio = null;
let lastFilePlayed = null;
let battery = null;


// ==========================================
// AUDIO GROUPS
// ==========================================

const audioGroups = {

  // 10% - 20%
  veryLow: [
    "audio/10-20 low charge.mp3",
    "audio/10-20(scream dialog).mp3",
    "audio/10-20(low dialog).mp3",
    "audio/scream (10-20).mp3"
  ],

  // 20% - 30%
  low: [
    "audio/20-30(yooo).mp3",
    "audio/dialog what the hell (20-30%).mp3",
    "audio/fahh(20-30).mp3"
  ],

  // 30% - 50%
  below50: [
    "audio/40-60.mp3",
    "audio/scolding.mp3",
    "audio/scream(50%).mp3"
  ],

  // 50% - 70%
  medium: [
    "audio/50-70.mp3",
    "audio/sad-meow-(40-60).mp3",
    "audio/scolding.mp3"
  ],

  // 70% - 99%
  high: [
    "audio/few minutes(70-100).mp3",
    "audio/ultimate warning.mp3"
  ],

  // 100%
  full: [
    "audio/100%.mp3",
    "audio/100% 2nd audio.mp3",
    "audio/fully charged.mp3"
  ]
};


// ==========================================
// SPECIAL CHAOS SOUNDS
// ==========================================

const chaosSounds = [
  "audio/low battery irritating funny sleep.mp3",
  "audio/spiderman-meme-song.mp3",
  "audio/i-love-you_1.mp3",
  "audio/scream 2.mp3"
];


// ==========================================
// HTML ELEMENTS
// ==========================================

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const statusPanel = document.getElementById("statusPanel");
const countEl = document.getElementById("count");
const historyText = document.getElementById("historyText");
const celebration = document.getElementById("celebration");


// ==========================================
// HISTORY
// ==========================================

function loadHistory() {

  const total = localStorage.getItem("totalOffenses") || 0;

  historyText.innerText =
    `All-time offenses: ${total}`;
}

loadHistory();


// ==========================================
// BATTERY DETECTION
// ==========================================

async function getBattery() {

  // Check whether browser supports Battery API
  if (!("getBattery" in navigator)) {

    console.log("Battery API is not supported on this browser.");

    return;
  }

  try {

    battery = await navigator.getBattery();

    console.log(
      `Battery: ${Math.round(battery.level * 100)}%`
    );

    // Watch for battery percentage changes
    battery.addEventListener("levelchange", () => {

      console.log(
        `Battery changed to ${Math.round(battery.level * 100)}%`
      );

    });

  } catch (error) {

    console.log("Could not access battery:", error);

  }
}

getBattery();


// ==========================================
// GET CURRENT BATTERY PERCENTAGE
// ==========================================

function getBatteryPercentage() {

  if (!battery) {

    // Temporary fallback if battery information
    // isn't available
    return 50;
  }

  return Math.round(battery.level * 100);
}


// ==========================================
// CHOOSE AUDIO GROUP
// ==========================================

function getAudioGroup() {

  const percentage = getBatteryPercentage();

  if (percentage <= 20) {

    return audioGroups.veryLow;

  } else if (percentage <= 30) {

    return audioGroups.low;

  } else if (percentage < 50) {

    return audioGroups.below50;

  } else if (percentage < 70) {

    return audioGroups.medium;

  } else if (percentage < 100) {

    return audioGroups.high;

  } else {

    return audioGroups.full;
  }
}


// ==========================================
// RANDOM AUDIO
// ==========================================

function getRandomAudio(list) {

  if (!list || list.length === 0) {
    return null;
  }

  // Prevent the same audio from playing twice
  // in a row when possible
  let available = list.filter(
    file => file !== lastFilePlayed
  );

  if (available.length === 0) {
    available = list;
  }

  const randomIndex =
    Math.floor(Math.random() * available.length);

  const selected = available[randomIndex];

  lastFilePlayed = selected;

  return selected;
}


// ==========================================
// PLAY AUDIO
// ==========================================

function playSound(file) {

  if (!file) {
    return;
  }

  // Stop previous audio
  if (currentAudio) {

    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(file);

  currentAudio.volume = 1;

  currentAudio.play()
    .then(() => {

      console.log("Playing:", file);

    })
    .catch(error => {

      console.log("Audio couldn't play:", error);

    });
}


// ==========================================
// STOP AUDIO
// ==========================================

function stopSound() {

  if (currentAudio) {

    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}


// ==========================================
// START CHARGING SESSION
// ==========================================

startBtn.addEventListener("click", async () => {

  isCharging = true;

  offenseCount = 0;
  lastPlayed = 0;
  lastFilePlayed = null;

  countEl.innerText = offenseCount;

  statusPanel.classList.remove("hidden");
  celebration.classList.add("hidden");
  startBtn.classList.add("hidden");

  // Reset interaction timer.
  // We don't want the START button itself
  // to count as "using the phone".
  lastInteraction = 0;

  // Try to unlock audio for mobile browsers
  const unlockFile = audioGroups.below50[0];

  const unlock = new Audio(unlockFile);

  unlock.volume = 0;

  try {

    await unlock.play();
    unlock.pause();

  } catch (error) {

    console.log("Audio unlock attempt:", error);

  }

  console.log(
    `Charging session started at ${getBatteryPercentage()}%`
  );
});


// ==========================================
// END CHARGING SESSION
// ==========================================

endBtn.addEventListener("click", () => {

  isCharging = false;

  stopSound();

  statusPanel.classList.add("hidden");
  startBtn.classList.remove("hidden");
  celebration.classList.remove("hidden");

  const celebrateSound =
    new Audio("audio/fully charged.mp3");

  celebrateSound.play().catch(() => {});

  const total =
    parseInt(
      localStorage.getItem("totalOffenses") || 0
    );

  localStorage.setItem(
    "totalOffenses",
    total + offenseCount
  );

  loadHistory();

  lastInteraction = 0;
});


// ==========================================
// DETECT PHONE USAGE
// ==========================================

function registerInteraction(event) {

  if (!isCharging) {
    return;
  }

  // Don't count the "Fully charged" button
  // as phone usage
  if (event.target === endBtn) {
    return;
  }

  lastInteraction = Date.now();
}


// Desktop + mobile interaction
[
  "pointerdown",
  "touchstart",
  "click",
  "scroll"
].forEach(eventName => {

  window.addEventListener(
    eventName,
    registerInteraction,
    { passive: true }
  );

});


// ==========================================
// CHECK IF USER IS STILL USING PHONE
// ==========================================

function isUserUsingPhone() {

  if (!isCharging) {
    return false;
  }

  const timeSinceInteraction =
    Date.now() - lastInteraction;

  // Consider the phone "in use" if there
  // was interaction within the last 3 seconds
  return timeSinceInteraction < 3000;
}


// ==========================================
// DECIDE WHEN TO SCOLD
// ==========================================

function maybeScold() {

  if (!isCharging) {
    return;
  }

  // User isn't currently interacting
  if (!isUserUsingPhone()) {

    // They probably put the phone down
    stopSound();

    return;
  }

  const now = Date.now();

  // Don't play another sound while the current
  // sound is still playing
  if (currentAudio && !currentAudio.paused) {
    return;
  }

  // Different cooldown depending on offense count
  let cooldown = 6000;

  if (offenseCount >= 3) {
    cooldown = 4500;
  }

  if (offenseCount >= 6) {
    cooldown = 3500;
  }

  if (offenseCount >= 10) {
    cooldown = 2500;
  }

  // Not enough time since previous sound
  if (now - lastPlayed < cooldown) {
    return;
  }


  // ========================================
  // CHOOSE BATTERY-APPROPRIATE AUDIO
  // ========================================

  const group = getAudioGroup();

  let selectedAudio = getRandomAudio(group);


  // ========================================
  // AFTER MANY OFFENSES, ADD CHAOS
  // ========================================

  if (offenseCount >= 5) {

    // 30% chance of a weird/chaotic sound
    if (Math.random() < 0.3) {

      selectedAudio =
        getRandomAudio(chaosSounds);
    }
  }


  // ========================================
  // PLAY IT
  // ========================================

  playSound(selectedAudio);

  lastPlayed = now;

  offenseCount++;

  countEl.innerText = offenseCount;

  console.log(
    `Offense #${offenseCount} | Battery: ${getBatteryPercentage()}%`
  );
}


// ==========================================
// CHECK EVERY SECOND
// ==========================================

setInterval(maybeScold, 1000);