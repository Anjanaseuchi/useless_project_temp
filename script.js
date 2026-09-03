// ==========================================
// CHARGER GUILT
// FINAL SCRIPT
// ==========================================


// ==========================================
// AUDIO FILES
// ==========================================

// Range-specific audio.
// If a filename contains a charging range,
// it belongs ONLY to that range.

const rangeAudios = [
  {
    min: 10,
    max: 20,

    files: [
      "audio/10-20 low charge.mp3",
      "audio/10-20(low dialog).mp3",
      "audio/10-20(scream dialog).mp3",
      "audio/scream (10-20).mp3"
    ]
  },

  {
    min: 20,
    max: 30,

    files: [
      "audio/20-30(yooo).mp3",
      "audio/dialog what the hell (20-30%).mp3",
      "audio/fahh(20-30).mp3"
    ]
  },

  {
    min: 40,
    max: 60,

    files: [
      "audio/40-60.mp3",
      "audio/sad-meow-(40-60).mp3"
    ]
  },

  {
    min: 50,
    max: 70,

    files: [
      "audio/50-70.mp3"
    ]
  },

  {
    min: 70,
    max: 100,

    files: [
      "audio/few minutes(70-100).mp3"
    ]
  }
];


// ==========================================
// COMMON AUDIO
// ==========================================

// These files have NO charging range
// in their filename.
//
// Therefore they are COMMON.

const commonAudios = [
  "audio/scolding.mp3",
  "audio/ultimate warning.mp3",
  "audio/scream 2.mp3",
  "audio/low battery irritating funny sleep.mp3",
  "audio/spiderman-meme-song.mp3",
  "audio/i-love-you_1.mp3"
];


// ==========================================
// FULLY CHARGED AUDIO
// ==========================================

const fullyChargedAudio =
  "audio/fully charged.mp3";


// ==========================================
// SETTINGS
// ==========================================

const USER_ACTIVE_TIME = 3000;

const AUDIO_GAP = 1000;


// ==========================================
// HTML ELEMENTS
// ==========================================

const startBtn =
  document.getElementById("startBtn");

const fullBtn =
  document.getElementById("fullBtn");

const batteryState =
  document.getElementById("batteryState");

const batteryPercent =
  document.getElementById("batteryPercent");

const statusPanel =
  document.getElementById("statusPanel");

const celebration =
  document.getElementById("celebration");

const useStatus =
  document.getElementById("useStatus");

const countElement =
  document.getElementById("count");


// ==========================================
// ANIMAL ELEMENTS
// ==========================================

const animalBox =
  document.getElementById("animalBox");

const animalFace =
  document.getElementById("animalFace");

const animalMessage =
  document.getElementById("animalMessage");


// ==========================================
// VARIABLES
// ==========================================

let battery = null;

let chargingSession = false;

let userIsActive = false;

let activeTimer = null;

let audioTimer = null;

let currentAudio = null;


// Ordered audio sequence

let sequence = [];

let sequenceIndex = 0;


// Animal escalation stage

let animalStage = 0;


// ==========================================
// CAUGHT COUNT
// ==========================================

let caughtCount =
  Number(
    localStorage.getItem(
      "chargerGuiltCaught"
    )
  ) || 0;

countElement.textContent =
  caughtCount;


// ==========================================
// GET BATTERY PERCENT
// ==========================================

function getBatteryPercent() {

  if (!battery) {
    return null;
  }

  return Math.round(
    battery.level * 100
  );
}


// ==========================================
// FIND RANGE AUDIO
// ==========================================

function getRangeAudio(percent) {

  const matchingRanges =
    rangeAudios.filter(range => {

      return (
        percent >= range.min &&
        percent <= range.max
      );

    });


  if (matchingRanges.length === 0) {
    return [];
  }


  // If ranges overlap, choose the range
  // with the highest starting percentage.
  //
  // Example:
  //
  // 55% matches:
  // 40-60
  // 50-70
  //
  // 50-70 wins.

  matchingRanges.sort(
    (a, b) => b.min - a.min
  );


  return matchingRanges[0].files;
}


// ==========================================
// BUILD ORDERED AUDIO SEQUENCE
// ==========================================

function buildSequence() {

  const percent =
    getBatteryPercent();


  if (percent === null) {

    sequence = [
      ...commonAudios
    ];

    sequenceIndex = 0;

    return;
  }


  const specificAudio =
    getRangeAudio(percent);


  // Specific range voices FIRST.
  //
  // Common voices AFTER them.

  sequence = [
    ...specificAudio,
    ...commonAudios
  ];


  sequenceIndex = 0;
}


// ==========================================
// GET NEXT AUDIO
// ==========================================

function getNextAudio() {

  if (sequence.length === 0) {
    return null;
  }


  const audioFile =
    sequence[sequenceIndex];


  sequenceIndex++;


  // Once we reach the end,
  // start again from the beginning.

  if (
    sequenceIndex >=
    sequence.length
  ) {

    sequenceIndex = 0;

  }


  return audioFile;
}


// ==========================================
// ANIMAL EXPRESSIONS
// ==========================================

function updateAnimal(stage) {

  if (!animalBox) {
    return;
  }


  animalBox.classList.remove(
    "suspicious",
    "annoyed",
    "angry",
    "screaming"
  );


  // ----------------------------------------
  // RESTING
  // ----------------------------------------

  if (stage === "resting") {

    animalFace.textContent =
      "🐱";

    animalMessage.textContent =
      "Aww... you're letting me rest. 🥺";

    animalStage = 0;

  }


  // ----------------------------------------
  // FIRST WARNING
  // ----------------------------------------

  else if (stage === "first") {

    animalFace.textContent =
      "🐰";

    animalMessage.textContent =
      "Umm... why are you touching the phone? 👀";

    animalBox.classList.add(
      "suspicious"
    );

    animalStage = 1;

  }


  // ----------------------------------------
  // SECOND WARNING
  // ----------------------------------------

  else if (stage === "second") {

    animalFace.textContent =
      "🐹";

    animalMessage.textContent =
      "Hey! I saw that scroll. 😐";

    animalBox.classList.add(
      "annoyed"
    );

    animalStage = 2;

  }


  // ----------------------------------------
  // THIRD WARNING
  // ----------------------------------------

  else if (stage === "third") {

    animalFace.textContent =
      "🐼";

    animalMessage.textContent =
      "BRO. PUT THE PHONE DOWN. 😾";

    animalBox.classList.add(
      "angry"
    );

    animalStage = 3;

  }


  // ----------------------------------------
  // MAXIMUM ANGER
  // ----------------------------------------

  else if (stage === "scream") {

    animalFace.textContent =
      "🐸";

    animalMessage.textContent =
      "AAAAAAAA!! CHARGE YOUR PHONE!! 🤬";

    animalBox.classList.add(
      "screaming"
    );

    animalStage = 4;

  }

}


// ==========================================
// ANIMAL BLINKING
// ==========================================

function animalBlink() {

  if (!animalBox) {
    return;
  }


  animalBox.classList.add(
    "blink"
  );


  setTimeout(() => {

    animalBox.classList.remove(
      "blink"
    );

  }, 150);

}


// Blink every few seconds.

setInterval(() => {

  animalBlink();

}, 3000);


// ==========================================
// PLAY NEXT AUDIO
// ==========================================

function playNextAudio() {

  if (!chargingSession) {
    return;
  }


  if (!userIsActive) {
    return;
  }


  const nextFile =
    getNextAudio();


  if (!nextFile) {
    return;
  }


  // ----------------------------------------
  // ANIMAL ESCALATION
  // ----------------------------------------

  const stage =
    sequenceIndex;


  if (animalStage === 0) {

    updateAnimal("first");

  }

  else if (animalStage === 1) {

    updateAnimal("second");

  }

  else if (animalStage === 2) {

    updateAnimal("third");

  }

  else {

    updateAnimal("scream");

  }


  // ----------------------------------------
  // STOP PREVIOUS AUDIO
  // ----------------------------------------

  if (currentAudio) {

    currentAudio.pause();

    currentAudio.currentTime = 0;

  }


  // ----------------------------------------
  // CREATE AUDIO
  // ----------------------------------------

  currentAudio =
    new Audio(nextFile);


  currentAudio.volume =
    1.0;


  // ----------------------------------------
  // PLAY
  // ----------------------------------------

  currentAudio
    .play()
    .catch(error => {

      console.log(
        "Audio playback blocked:",
        error
      );

    });


  // ----------------------------------------
  // AFTER AUDIO FINISHES
  // ----------------------------------------

  currentAudio.onended = () => {

    if (
      !chargingSession ||
      !userIsActive
    ) {

      return;

    }


    clearTimeout(
      audioTimer
    );


    audioTimer =
      setTimeout(() => {

        if (
          chargingSession &&
          userIsActive
        ) {

          playNextAudio();

        }

      }, AUDIO_GAP);

  };

}


// ==========================================
// STOP AUDIO
// ==========================================

function stopAudio() {

  clearTimeout(
    audioTimer
  );


  if (currentAudio) {

    currentAudio.pause();

    currentAudio.currentTime = 0;

    currentAudio = null;

  }

}


// ==========================================
// USER STARTED USING PHONE
// ==========================================

function userStartedUsingPhone() {

  if (!chargingSession) {
    return;
  }


  // ----------------------------------------
  // FIRST INTERACTION
  // ----------------------------------------

  if (!userIsActive) {

    userIsActive = true;


    useStatus.textContent =
      "😈 CAUGHT! Stop using your phone!";


    caughtCount++;


    localStorage.setItem(
      "chargerGuiltCaught",
      caughtCount
    );


    countElement.textContent =
      caughtCount;


    // Start with the first expression.

    updateAnimal(
      "first"
    );


    // Start the first audio.

    playNextAudio();

  }


  // ----------------------------------------
  // KEEP USER ACTIVE
  // ----------------------------------------

  clearTimeout(
    activeTimer
  );


  activeTimer =
    setTimeout(() => {

      userStoppedUsingPhone();

    }, USER_ACTIVE_TIME);

}


// ==========================================
// USER STOPPED USING PHONE
// ==========================================

function userStoppedUsingPhone() {

  userIsActive = false;


  clearTimeout(
    activeTimer
  );


  stopAudio();


  useStatus.textContent =
    "💤 Phone is resting...";


  // Animal becomes cute again.

  updateAnimal(
    "resting"
  );

}


// ==========================================
// USER ACTIVITY EVENTS
// ==========================================

[
  "touchstart",
  "touchmove",
  "pointerdown",
  "click",
  "scroll",
  "keydown"
].forEach(eventName => {

  document.addEventListener(
    eventName,
    userStartedUsingPhone,
    {
      passive: true
    }
  );

});


// ==========================================
// START CHARGING SESSION
// ==========================================

startBtn.addEventListener(
  "click",
  () => {

    if (!battery) {
      return;
    }


    const percent =
      getBatteryPercent();


    // Never allow this at 100%.

    if (percent >= 100) {

      updateBatteryUI();

      return;

    }


    chargingSession = true;

    userIsActive = false;


    // Create ordered sequence.

    buildSequence();


    // Reset animal.

    updateAnimal(
      "resting"
    );


    startBtn.classList.add(
      "hidden"
    );


    fullBtn.classList.add(
      "hidden"
    );


    statusPanel.classList.remove(
      "hidden"
    );


    celebration.classList.add(
      "hidden"
    );


    useStatus.textContent =
      "💤 Phone is resting...";


    // IMPORTANT:
    //
    // No audio starts here.
    //
    // Audio starts only after
    // the user interacts with
    // the phone.

  }
);


// ==========================================
// FULLY CHARGED
// ==========================================

fullBtn.addEventListener(
  "click",
  () => {

    if (!battery) {
      return;
    }


    const percent =
      getBatteryPercent();


    // Verify actual battery level.

    if (percent !== 100) {

      updateBatteryUI();

      return;

    }


    chargingSession = false;

    userIsActive = false;


    stopAudio();


    // Play happy audio.

    const audio =
      new Audio(
        fullyChargedAudio
      );


    audio.volume =
      1.0;


    audio
      .play()
      .catch(error => {

        console.log(
          "Full charge audio blocked:",
          error
        );

      });


    celebration.classList.remove(
      "hidden"
    );


    statusPanel.classList.add(
      "hidden"
    );


    useStatus.textContent =
      "🎉 YES! 100%!";


    updateAnimal(
      "resting"
    );

  }
);


// ==========================================
// UPDATE BATTERY UI
// ==========================================

function updateBatteryUI() {

  if (!battery) {
    return;
  }


  const percent =
    getBatteryPercent();


  batteryState.textContent =
    `🔋 Battery: ${percent}%`;


  batteryPercent.textContent =
    `${percent}%`;


  // ========================================
  // FULLY CHARGED
  // ========================================

  if (percent >= 100) {

    chargingSession = false;

    userIsActive = false;


    stopAudio();


    statusPanel.classList.add(
      "hidden"
    );


    startBtn.classList.add(
      "hidden"
    );


    fullBtn.classList.remove(
      "hidden"
    );


    celebration.classList.add(
      "hidden"
    );


    updateAnimal(
      "resting"
    );


    return;
  }


  // ========================================
  // BELOW 100%
  // ========================================

  fullBtn.classList.add(
    "hidden"
  );


  celebration.classList.add(
    "hidden"
  );


  if (!chargingSession) {

    startBtn.classList.remove(
      "hidden"
    );

  }


  // ----------------------------------------
  // BATTERY RANGE CHANGED
  // ----------------------------------------

  if (chargingSession) {

    const wasActive =
      userIsActive;


    buildSequence();


    if (wasActive) {

      stopAudio();


      playNextAudio();

    }

  }

}


// ==========================================
// BATTERY INITIALIZATION
// ==========================================

async function initBattery() {

  // Browser doesn't support Battery API.

  if (
    !("getBattery" in navigator)
  ) {

    batteryState.textContent =
      "🔋 Battery status unavailable";


    startBtn.classList.remove(
      "hidden"
    );


    return;

  }


  try {

    battery =
      await navigator.getBattery();


    // Initial UI.

    updateBatteryUI();


    // Battery percentage changed.

    battery.addEventListener(
      "levelchange",
      updateBatteryUI
    );


    // Charger plugged/unplugged.

    battery.addEventListener(
      "chargingchange",
      updateBatteryUI
    );

  }

  catch (error) {

    console.log(
      "Battery API error:",
      error
    );


    batteryState.textContent =
      "🔋 Battery status unavailable";


    startBtn.classList.remove(
      "hidden"
    );

  }

}


// ==========================================
// INITIAL ANIMAL STATE
// ==========================================

updateAnimal(
  "resting"
);


// ==========================================
// START APP
// ==========================================

initBattery();