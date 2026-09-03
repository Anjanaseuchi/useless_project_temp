// ==========================================
// CHARGER GUILT
// ==========================================

// ---------- AUDIO FILES ----------

const audioGroups = {
  veryLow: [
    "audio/10-20 low charge.mp3",
    "audio/10-20(scream dialog).mp3",
    "audio/10-20(low dialog).mp3",
    "audio/scream (10-20).mp3"
  ],

  low: [
    "audio/20-30(yooo).mp3",
    "audio/dialog what the hell (20-30%).mp3",
    "audio/fahh(20-30).mp3"
  ],

  below50: [
    "audio/40-60.mp3",
    "audio/scolding.mp3",
    "audio/scream(50%).mp3"
  ],

  medium: [
    "audio/50-70.mp3",
    "audio/sad-meow-(40-60).mp3",
    "audio/scolding.mp3"
  ],

  high: [
    "audio/few minutes(70-100).mp3",
    "audio/ultimate warning.mp3"
  ]
};

// Happy sound when battery reaches 100%
const fullyChargedAudio = "audio/fully charged.mp3";


// ---------- HTML ELEMENTS ----------

const startBtn = document.getElementById("startBtn");
const fullBtn = document.getElementById("fullBtn");

const statusPanel = document.getElementById("statusPanel");
const celebration = document.getElementById("celebration");

const tagline = document.getElementById("tagline");
const batteryState = document.getElementById("batteryState");

const batteryPercent = document.getElementById("batteryPercent");
const batteryEmoji = document.getElementById("battery-emoji");

const countEl = document.getElementById("count");
const useStatus = document.getElementById("useStatus");
const historyText = document.getElementById("historyText");


// ---------- VARIABLES ----------

let battery = null;

let chargingSessionActive = false;

let currentAudio = null;
let nextAudioTimer = null;

let lastUserActivity = 0;

let activityCheckTimer = null;

let caughtCount = Number(
  localStorage.getItem("chargerGuiltCaught") || 0
);

countEl.textContent = caughtCount;


// How long we consider the phone "being used"
// after the last touch/scroll/motion.
const USER_ACTIVE_TIME = 3000;


// Gap between voice clips.
const AUDIO_GAP = 1000;


// ---------- HELPERS ----------

function hide(element) {
  element.classList.add("hidden");
}

function show(element) {
  element.classList.remove("hidden");
}


// ---------- BATTERY GROUP ----------

function getAudioGroup(level) {

  const percent = level * 100;

  if (percent <= 20) {
    return audioGroups.veryLow;
  }

  if (percent <= 30) {
    return audioGroups.low;
  }

  if (percent < 50) {
    return audioGroups.below50;
  }

  if (percent < 70) {
    return audioGroups.medium;
  }

  return audioGroups.high;
}


// ---------- RANDOM AUDIO ----------

function getRandomAudio(group) {

  if (!group || group.length === 0) {
    return null;
  }

  return group[
    Math.floor(Math.random() * group.length)
  ];
}


// ---------- STOP AUDIO ----------

function stopAudio() {

  if (nextAudioTimer) {
    clearTimeout(nextAudioTimer);
    nextAudioTimer = null;
  }

  if (currentAudio) {

    currentAudio.pause();

    currentAudio.currentTime = 0;

    currentAudio = null;
  }
}


// ---------- IS USER USING PHONE? ----------

function isUserUsingPhone() {

  return (
    Date.now() - lastUserActivity <= USER_ACTIVE_TIME
  );
}


// ---------- PLAY NEXT SCOLDING ----------

function playNextScolding() {

  // Session must still be active.
  if (!chargingSessionActive) {
    return;
  }

  // Don't play if user stopped using phone.
  if (!isUserUsingPhone()) {

    useStatus.textContent =
      "💤 Phone is resting...";

    return;
  }

  // Need battery information.
  if (!battery) {
    return;
  }

  // Battery became full.
  if (battery.level >= 1) {
    handleFullyCharged();
    return;
  }


  const group = getAudioGroup(battery.level);

  const sound = getRandomAudio(group);

  if (!sound) {
    return;
  }


  currentAudio = new Audio(sound);

  currentAudio.volume = 1.0;


  currentAudio.addEventListener("ended", () => {

    currentAudio = null;

    // Wait roughly one second before another sound.
    if (
      chargingSessionActive &&
      isUserUsingPhone()
    ) {

      nextAudioTimer = setTimeout(() => {

        nextAudioTimer = null;

        playNextScolding();

      }, AUDIO_GAP);

    }

  });


  currentAudio.addEventListener("error", () => {

    console.error(
      "Could not play audio:",
      sound
    );

    currentAudio = null;
  });


  currentAudio.play()
    .catch(error => {

      console.log(
        "Audio playback was blocked:",
        error
      );

    });
}


// ---------- START SCOLDING ----------

function startScolding() {

  if (!chargingSessionActive) {
    return;
  }

  if (!isUserUsingPhone()) {
    return;
  }

  // Already playing.
  if (currentAudio && !currentAudio.paused) {
    return;
  }

  // Already waiting for next sound.
  if (nextAudioTimer) {
    return;
  }

  caughtCount++;

  countEl.textContent = caughtCount;

  localStorage.setItem(
    "chargerGuiltCaught",
    caughtCount
  );

  useStatus.textContent =
    "😡 CAUGHT! Put the phone down!";

  playNextScolding();
}


// ---------- USER ACTIVITY ----------

function registerUserActivity(event) {

  // Don't count the initial "Just Plugged In"
  // button click as phone usage.
  if (
    event &&
    (
      event.target === startBtn ||
      event.target === fullBtn
    )
  ) {
    return;
  }


  if (!chargingSessionActive) {
    return;
  }


  lastUserActivity = Date.now();

  useStatus.textContent =
    "📱 You're using the phone...";


  // Start audio only AFTER the user actually
  // interacts with the phone.
  startScolding();
}


// ---------- TOUCH ----------

window.addEventListener(
  "touchstart",
  registerUserActivity,
  { passive: true }
);

window.addEventListener(
  "touchmove",
  registerUserActivity,
  { passive: true }
);


// ---------- CLICK ----------

window.addEventListener(
  "click",
  registerUserActivity
);


// ---------- SCROLL ----------

window.addEventListener(
  "scroll",
  registerUserActivity,
  { passive: true }
);


// ---------- KEYBOARD ----------

window.addEventListener(
  "keydown",
  registerUserActivity
);


// ---------- POINTER ----------

window.addEventListener(
  "pointerdown",
  registerUserActivity
);


// ---------- MOTION DETECTION ----------

function handleMotion(event) {

  if (!chargingSessionActive) {
    return;
  }


  const acceleration =
    event.accelerationIncludingGravity;

  if (!acceleration) {
    return;
  }


  const x = acceleration.x || 0;
  const y = acceleration.y || 0;
  const z = acceleration.z || 0;


  const movement =
    Math.sqrt(
      x * x +
      y * y +
      z * z
    );


  // Around 1g means the phone is simply stationary.
  // Larger changes suggest movement/picking up.
  if (Math.abs(movement - 9.8) > 1.5) {

    lastUserActivity = Date.now();

    useStatus.textContent =
      "📱 You picked it up! 😡";

    startScolding();
  }
}


// ---------- ENABLE MOTION ----------

async function enableMotionDetection() {

  if (
    typeof DeviceMotionEvent === "undefined"
  ) {
    return;
  }


  // iPhone/iPad may require permission.
  if (
    typeof DeviceMotionEvent.requestPermission ===
    "function"
  ) {

    try {

      const permission =
        await DeviceMotionEvent.requestPermission();

      if (permission === "granted") {

        window.addEventListener(
          "devicemotion",
          handleMotion
        );

      }

    } catch (error) {

      console.log(
        "Motion permission unavailable:",
        error
      );

    }

  } else {

    window.addEventListener(
      "devicemotion",
      handleMotion
    );
  }
}


// ---------- CHECK USER ACTIVITY ----------

function checkUserActivity() {

  if (!chargingSessionActive) {
    return;
  }


  if (!isUserUsingPhone()) {

    useStatus.textContent =
      "💤 Phone is resting...";

    // Stop currently playing audio.
    if (currentAudio) {
      stopAudio();
    }
  }
}


activityCheckTimer = setInterval(
  checkUserActivity,
  500
);


// ---------- START CHARGING SESSION ----------

startBtn.addEventListener(
  "click",
  async () => {

    // Safety check.
    if (battery && battery.level >= 1) {

      handleFullyCharged();

      return;
    }


    chargingSessionActive = true;

    lastUserActivity = 0;


    hide(startBtn);

    show(statusPanel);

    hide(celebration);


    tagline.textContent =
      "🔌 Charging started. Leave the phone alone...";


    useStatus.textContent =
      "💤 Phone is resting...";


    // IMPORTANT:
    // No audio here.
    // Audio only starts when user uses phone.


    // Ask for motion permission after user click.
    await enableMotionDetection();
  }
);


// ---------- FULLY CHARGED BUTTON ----------

fullBtn.addEventListener(
  "click",
  () => {

    // VERY IMPORTANT SAFETY CHECK.
    // Even if someone somehow clicks the button,
    // we verify the real battery level first.

    if (!battery || battery.level < 1) {

      hide(fullBtn);

      show(startBtn);

      batteryState.textContent =
        "🔋 Battery is not full yet.";

      return;
    }


    chargingSessionActive = false;

    stopAudio();


    hide(fullBtn);

    hide(statusPanel);

    show(celebration);


    tagline.textContent =
      "You survived the charging session. 🎉";


    batteryState.textContent =
      "🔋 Battery: 100%";


    playFullyChargedSound();
  }
);


// ---------- FULLY CHARGED AUDIO ----------

function playFullyChargedSound() {

  const audio =
    new Audio(fullyChargedAudio);

  audio.volume = 1.0;

  audio.play()
    .catch(error => {

      console.error(
        "Fully charged audio could not play:",
        error
      );

      historyText.textContent =
        "⚠️ Couldn't play the celebration audio. Check the audio filename/path.";
    });
}


// ---------- BATTERY BECAME FULL ----------

function handleFullyCharged() {

  chargingSessionActive = false;

  stopAudio();


  hide(startBtn);

  hide(statusPanel);

  show(fullBtn);


  batteryState.textContent =
    "🔋 Battery: 100% — Fully Charged!";

  tagline.textContent =
    "🎉 Your phone made it to 100%.";


  useStatus.textContent =
    "🎉 You may celebrate now.";


  celebration.classList.add("hidden");
}


// ---------- UPDATE BATTERY UI ----------

function updateBatteryUI() {

  if (!battery) {
    return;
  }


  const percent =
    Math.round(battery.level * 100);


  batteryPercent.textContent =
    `${percent}%`;


  batteryState.textContent =
    `🔋 Battery: ${percent}%`;


  // Full battery
  if (battery.level >= 1) {

    handleFullyCharged();

    return;
  }


  // Battery below 100%
  hide(fullBtn);


  // Only show Start button if
  // no charging session is active.
  if (!chargingSessionActive) {

    show(startBtn);

    tagline.textContent =
      "Put it down. Let it charge. It'll only take a minute.";

    batteryState.textContent =
      `🔋 Battery: ${percent}% — Not full yet`;
  }
}


// ---------- BATTERY LEVEL CHANGED ----------

function handleBatteryLevelChange() {

  updateBatteryUI();
}


// ---------- BATTERY CHARGING CHANGED ----------

function handleChargingChange() {

  if (!battery) {
    return;
  }


  const percent =
    Math.round(battery.level * 100);


  if (battery.charging) {

    batteryState.textContent =
      `⚡ Charging — ${percent}%`;

  } else {

    batteryState.textContent =
      `🔋 ${percent}% — Not currently charging`;
  }


  updateBatteryUI();
}


// ---------- INITIALIZE BATTERY ----------

async function initializeBattery() {

  // Battery Status API not supported.
  if (
    !("getBattery" in navigator)
  ) {

    console.log(
      "Battery Status API is not supported."
    );


    // Safe fallback:
    // Never pretend that the battery is 100%.
    hide(fullBtn);

    show(startBtn);

    batteryState.textContent =
      "🔋 Battery status unavailable";

    tagline.textContent =
      "Plug in your phone and leave it alone.";

    historyText.textContent =
      "Battery detection isn't supported by this browser. Using charging-session mode.";

    return;
  }


  try {

    battery =
      await navigator.getBattery();


    // Initial check.
    updateBatteryUI();


    // Listen for battery percentage changes.
    battery.addEventListener(
      "levelchange",
      handleBatteryLevelChange
    );


    // Listen for charger plugged/unplugged.
    battery.addEventListener(
      "chargingchange",
      handleChargingChange
    );


    handleChargingChange();

  } catch (error) {

    console.error(
      "Battery initialization failed:",
      error
    );


    // Safe fallback.
    hide(fullBtn);

    show(startBtn);

    batteryState.textContent =
      "🔋 Battery detection unavailable";
  }
}


// ---------- START APP ----------

initializeBattery();