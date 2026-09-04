// ===============================
// CHARGER GUILT - FULL SCRIPT
// ===============================

// ---------- HTML ELEMENTS ----------
const plugButton = document.getElementById("plugButton");
const fullButton = document.getElementById("fullButton");

const batteryText = document.getElementById("batteryText");
const batteryFill = document.getElementById("batteryFill");
const character = document.getElementById("character");
const statusText = document.getElementById("statusText");


// ---------- SETTINGS ----------
const AUDIO_FOLDER = "audio/";
const INACTIVITY_TIME = 5000; // 5 seconds


// ======================================================
// AUDIO FILES
// ======================================================

// Battery-specific audio
const batteryRangeAudio = [
    {
        min: 10,
        max: 20,
        files: [
            "10-20 low charge (gogo).mp3",
            "10-20(low dialog).mp3",
            "10-20(scream dialog).mp3"
        ]
    },

    {
        min: 20,
        max: 30,
        files: [
            "20-30(yooo).mp3",
            "fahh(20-30).mp3"
        ]
    },

    {
        min: 40,
        max: 60,
        files: [
            "40-60.mp3"
        ]
    },

    {
        min: 70,
        max: 100,
        files: [
            "few minutes(70-100).mp3"
        ]
    }
];


// Exact battery percentage audio
const exactBatteryAudio = {
    50: [
        "scream(50%).mp3"
    ]
};


// Numbered common audio
// MUST play in this exact order
const numberedCommonAudio = [
    "eheh(1st).mp3",
    "sad-meow(2)-.mp3",
    "yaya(3rd).mp3",
    "(4)chachaa.mp3",
    "emotional-damage-meme(5).mp3",
    "hey-prabhu-hey-hari-ram(6).mp3",
    "dialog what the hell (7).mp3",
    "kanchana(8).mp3"
];


// Remaining common audio
// Plays after 1 -> 8
const remainingCommonAudio = [
    "scolding.mp3",
    "scream 2.mp3",
    "scream1.mp3",
    "scream3.mp3",
    "spiderman-meme-song.mp3",
    "ultimate warning.mp3"
];


// 100% audio
// These are ONLY for full battery
const fullBatteryAudio = [
    "100%.mp3",
    "100% 2nd audio.mp3"
];


// Audio when Fully Charged button is clicked
const fullyChargedButtonAudio = [
    "(fully charged).mp3"
];


// ======================================================
// VARIABLES
// ======================================================

let batteryLevel = 0;

let chargingStarted = false;
let userIsActive = false;

let inactivityTimer = null;

let audioQueue = [];
let queueIndex = 0;

let currentAudio = null;

let queueRunning = false;

let batteryInitialized = false;


// ======================================================
// AUDIO URL
// ======================================================

function getAudioURL(filename) {
    return AUDIO_FOLDER + encodeURIComponent(filename);
}


// ======================================================
// STOP CURRENT AUDIO
// ======================================================

function stopCurrentAudio() {

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}


// ======================================================
// PLAY SINGLE AUDIO
// ======================================================

function playSingleAudio(filename) {

    return new Promise((resolve) => {

        stopCurrentAudio();

        const audio = new Audio(getAudioURL(filename));

        currentAudio = audio;

        audio.volume = 1.0;

        audio.onended = () => {
            if (currentAudio === audio) {
                currentAudio = null;
            }

            resolve(true);
        };

        audio.onerror = () => {

            console.warn(
                "❌ Audio failed:",
                filename,
                "\nURL:",
                getAudioURL(filename)
            );

            if (currentAudio === audio) {
                currentAudio = null;
            }

            resolve(false);
        };

        const playPromise = audio.play();

        if (playPromise !== undefined) {

            playPromise.catch((error) => {

                console.warn(
                    "⚠️ Audio could not play:",
                    filename,
                    error
                );

                if (currentAudio === audio) {
                    currentAudio = null;
                }

                resolve(false);
            });
        }
    });
}


// ======================================================
// SMALL GAP BETWEEN AUDIOS
// ======================================================

function wait(ms) {

    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}


// ======================================================
// GET EXACT BATTERY AUDIO
// ======================================================

function getExactBatteryAudio(percent) {

    if (exactBatteryAudio[percent]) {
        return [...exactBatteryAudio[percent]];
    }

    return [];
}


// ======================================================
// GET RANGE BATTERY AUDIO
// ======================================================

function getRangeBatteryAudio(percent) {

    const result = [];

    for (const range of batteryRangeAudio) {

        if (
            percent >= range.min &&
            percent < range.max
        ) {

            result.push(...range.files);
        }
    }

    return result;
}


// ======================================================
// BUILD AUDIO QUEUE
// ======================================================

function buildAudioQueue(percent) {

    const queue = [];

    // --------------------------------
    // 1. EXACT BATTERY AUDIO FIRST
    // --------------------------------

    const exactAudio = getExactBatteryAudio(percent);

    queue.push(...exactAudio);


    // --------------------------------
    // 2. BATTERY RANGE AUDIO
    // --------------------------------

    const rangeAudio = getRangeBatteryAudio(percent);

    queue.push(...rangeAudio);


    // --------------------------------
    // 3. NUMBERED COMMON AUDIO
    // --------------------------------

    queue.push(...numberedCommonAudio);


    // --------------------------------
    // 4. REMAINING COMMON AUDIO
    // --------------------------------

    queue.push(...remainingCommonAudio);


    return queue;
}


// ======================================================
// START CHARGING AUDIO QUEUE
// ======================================================

async function playChargingQueue() {

    if (!chargingStarted) {
        return;
    }

    if (!userIsActive) {
        return;
    }

    if (batteryLevel >= 100) {
        return;
    }

    if (queueRunning) {
        return;
    }

    queueRunning = true;


    // Build queue if empty
    if (audioQueue.length === 0) {

        audioQueue = buildAudioQueue(batteryLevel);

        queueIndex = 0;
    }


    while (
        chargingStarted &&
        userIsActive &&
        batteryLevel < 100
    ) {

        if (queueIndex >= audioQueue.length) {

            // Start again from beginning
            // after all audio has played
            queueIndex = 0;
        }


        const filename = audioQueue[queueIndex];

        console.log(
            "🔊 Playing:",
            filename
        );


        await playSingleAudio(filename);


        // Move to next audio
        queueIndex++;


        // If user stopped using phone,
        // stop immediately
        if (!chargingStarted || !userIsActive) {
            break;
        }

        if (batteryLevel >= 100) {
            break;
        }


        // About 1 second gap
        await wait(1000);
    }


    queueRunning = false;

    stopCurrentAudio();
}


// ======================================================
// USER BECAME ACTIVE
// ======================================================

function userBecameActive() {

    if (!chargingStarted) {
        return;
    }

    if (batteryLevel >= 100) {
        return;
    }


    userIsActive = true;

    clearTimeout(inactivityTimer);


    character.classList.remove(
        "happy",
        "watching",
        "annoyed",
        "angry",
        "rage",
        "celebrate"
    );

    character.classList.add("annoyed");


    statusText.textContent =
        "HEY! I SAW THAT! 😾";


    console.log("📱 User active");


    playChargingQueue();
}


// ======================================================
// USER BECAME INACTIVE
// ======================================================

function userBecameInactive() {

    clearTimeout(inactivityTimer);


    inactivityTimer = setTimeout(() => {

        userIsActive = false;


        stopCurrentAudio();


        character.classList.remove(
            "happy",
            "watching",
            "annoyed",
            "angry",
            "rage",
            "celebrate"
        );

        character.classList.add("watching");


        statusText.textContent =
            "Good... put the phone down. 😼";


        console.log("😴 User inactive");

    }, INACTIVITY_TIME);
}


// ======================================================
// ACTIVITY EVENT
// ======================================================

function activityDetected() {

    if (!chargingStarted) {
        return;
    }

    if (batteryLevel >= 100) {
        return;
    }


    userBecameActive();

    userBecameInactive();
}


// ======================================================
// TOUCH
// ======================================================

document.addEventListener(
    "touchstart",
    activityDetected,
    { passive: true }
);

document.addEventListener(
    "touchmove",
    activityDetected,
    { passive: true }
);

document.addEventListener(
    "touchend",
    activityDetected,
    { passive: true }
);


// ======================================================
// MOUSE
// ======================================================

document.addEventListener(
    "mousedown",
    activityDetected,
    { passive: true }
);

document.addEventListener(
    "mousemove",
    activityDetected,
    { passive: true }
);


// ======================================================
// KEYBOARD
// ======================================================

document.addEventListener(
    "keydown",
    activityDetected
);


// ======================================================
// SCROLL
// ======================================================

document.addEventListener(
    "scroll",
    activityDetected,
    { passive: true }
);


// ======================================================
// SCREEN VISIBILITY
// ======================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.visibilityState === "visible") {

            if (
                chargingStarted &&
                batteryLevel < 100
            ) {

                activityDetected();
            }

        } else {

            userIsActive = false;

            stopCurrentAudio();
        }
    }
);


// ======================================================
// DEVICE MOTION
// ======================================================

function setupMotionDetection() {

    if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function"
    ) {

        // iPhone / iPad
        document.addEventListener(
            "click",
            requestMotionPermission,
            { once: true }
        );

    } else {

        window.addEventListener(
            "devicemotion",
            handleMotion,
            { passive: true }
        );
    }
}


async function requestMotionPermission() {

    try {

        const permission =
            await DeviceMotionEvent.requestPermission();

        if (permission === "granted") {

            window.addEventListener(
                "devicemotion",
                handleMotion,
                { passive: true }
            );

            console.log(
                "✅ Motion permission granted"
            );
        }

    } catch (error) {

        console.warn(
            "Motion permission failed:",
            error
        );
    }
}


function handleMotion(event) {

    if (!chargingStarted) {
        return;
    }

    if (batteryLevel >= 100) {
        return;
    }


    const acc = event.accelerationIncludingGravity;

    if (!acc) {
        return;
    }


    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;


    const movement =
        Math.sqrt(
            x * x +
            y * y +
            z * z
        );


    // Detect phone movement
    if (movement > 12) {

        activityDetected();
    }
}


// ======================================================
// UPDATE BATTERY UI
// ======================================================

function updateBatteryUI(level) {

    batteryLevel = Math.round(level);


    batteryText.textContent =
        batteryLevel + "%";


    batteryFill.style.width =
        batteryLevel + "%";


    // --------------------------------
    // FULL BATTERY
    // --------------------------------

    if (batteryLevel >= 100) {

        batteryLevel = 100;


        batteryText.textContent =
            "100%";


        batteryFill.style.width =
            "100%";


        plugButton.style.display =
            "none";

        fullButton.style.display =
            "inline-block";


        statusText.textContent =
            "FULLY CHARGED! 🎉";


        character.classList.remove(
            "happy",
            "watching",
            "annoyed",
            "angry",
            "rage"
        );

        character.classList.add(
            "celebrate"
        );


        chargingStarted = false;
        userIsActive = false;


        clearTimeout(inactivityTimer);

        stopCurrentAudio();


        audioQueue = [];
        queueIndex = 0;
        queueRunning = false;


        return;
    }


    // --------------------------------
    // NOT FULL
    // --------------------------------

    plugButton.style.display =
        "inline-block";

    fullButton.style.display =
        "none";


    if (chargingStarted) {

        character.classList.remove(
            "happy",
            "watching",
            "annoyed",
            "angry",
            "rage",
            "celebrate"
        );

        character.classList.add(
            "happy"
        );
    }
}


// ======================================================
// BATTERY API
// ======================================================

async function setupBattery() {

    if (!("getBattery" in navigator)) {

        batteryText.textContent =
            "Battery API unavailable";

        statusText.textContent =
            "Battery detection isn't supported here.";

        console.warn(
            "⚠️ Battery API unavailable"
        );

        return;
    }


    try {

        const battery =
            await navigator.getBattery();


        function updateBattery() {

            const level =
                battery.level * 100;


            updateBatteryUI(level);


            console.log(
                "🔋 Battery:",
                Math.round(level) + "%"
            );
        }


        // Initial battery
        updateBattery();


        // Battery percentage changed
        battery.addEventListener(
            "levelchange",
            updateBattery
        );


        // Charging state changed
        battery.addEventListener(
            "chargingchange",
            () => {

                console.log(
                    "⚡ Charging:",
                    battery.charging
                );


                if (battery.charging) {

                    if (battery.level * 100 < 100) {

                        statusText.textContent =
                            "Charging... 🔌";

                    }

                } else {

                    statusText.textContent =
                        "Not charging";

                    chargingStarted = false;
                    userIsActive = false;

                    stopCurrentAudio();

                    clearTimeout(
                        inactivityTimer
                    );
                }
            }
        );


    } catch (error) {

        console.error(
            "Battery API error:",
            error
        );

        batteryText.textContent =
            "Battery unavailable";

        statusText.textContent =
            "Could not read battery.";
    }
}


// ======================================================
// JUST PLUGGED IN BUTTON
// ======================================================

plugButton.addEventListener(
    "click",
    () => {

        // Don't play audio immediately
        chargingStarted = true;

        userIsActive = false;


        clearTimeout(inactivityTimer);

        stopCurrentAudio();


        // Reset queue
        audioQueue =
            buildAudioQueue(
                batteryLevel
            );

        queueIndex = 0;

        queueRunning = false;


        character.classList.remove(
            "happy",
            "annoyed",
            "angry",
            "rage",
            "celebrate"
        );

        character.classList.add(
            "watching"
        );


        statusText.textContent =
            "I'm watching you... 👀";


        console.log(
            "🔌 Charging session started"
        );


        // IMPORTANT:
        // No audio here.
        // Audio starts only when activity
        // is detected.
    }
);


// ======================================================
// FULLY CHARGED BUTTON
// ======================================================

fullButton.addEventListener(
    "click",
    async () => {

        // Stop anything else
        stopCurrentAudio();


        chargingStarted = false;
        userIsActive = false;


        clearTimeout(inactivityTimer);


        character.classList.remove(
            "happy",
            "watching",
            "annoyed",
            "angry",
            "rage"
        );

        character.classList.add(
            "celebrate"
        );


        statusText.textContent =
            "YAY! FULLY CHARGED! 🎉🔋";


        // Play only the full-charge sound
        for (
            const filename
            of fullyChargedButtonAudio
        ) {

            await playSingleAudio(
                filename
            );

            await wait(500);
        }
    }
);


// ======================================================
// INITIAL PAGE STATE
// ======================================================

function initializePage() {

    plugButton.style.display =
        "inline-block";

    fullButton.style.display =
        "none";


    batteryText.textContent =
        "Checking...";


    statusText.textContent =
        "Waiting...";


    character.classList.remove(
        "watching",
        "annoyed",
        "angry",
        "rage",
        "celebrate"
    );

    character.classList.add(
        "happy"
    );
}


// ======================================================
// START
// ======================================================

initializePage();

setupMotionDetection();

setupBattery();


// ======================================================
// DEBUG: CHECK ALL AUDIO FILES
// ======================================================

async function checkAudioFiles() {

    console.log(
        "================================"
    );

    console.log(
        "🔍 CHECKING AUDIO FILES..."
    );

    console.log(
        "================================"
    );


    const allFiles = new Set();


    // Battery ranges
    for (
        const range
        of batteryRangeAudio
    ) {

        for (
            const file
            of range.files
        ) {

            allFiles.add(file);
        }
    }


    // Exact battery
    for (
        const files
        of Object.values(
            exactBatteryAudio
        )
    ) {

        for (
            const file
            of files
        ) {

            allFiles.add(file);
        }
    }


    // Numbered common
    for (
        const file
        of numberedCommonAudio
    ) {

        allFiles.add(file);
    }


    // Remaining common
    for (
        const file
        of remainingCommonAudio
    ) {

        allFiles.add(file);
    }


    // 100%
    for (
        const file
        of fullBatteryAudio
    ) {

        allFiles.add(file);
    }


    // Fully charged
    for (
        const file
        of fullyChargedButtonAudio
    ) {

        allFiles.add(file);
    }


    for (
        const filename
        of allFiles
    ) {

        await new Promise(resolve => {

            const audio =
                new Audio(
                    getAudioURL(filename)
                );


            audio.addEventListener(
                "canplaythrough",
                () => {

                    console.log(
                        "✅ WORKING:",
                        filename
                    );

                    resolve();
                },
                { once: true }
            );


            audio.addEventListener(
                "error",
                () => {

                    console.error(
                        "❌ FAILED:",
                        filename
                    );

                    console.error(
                        "URL:",
                        getAudioURL(filename)
                    );

                    resolve();
                },
                { once: true }
            );


            audio.load();
        });
    }


    console.log(
        "================================"
    );

    console.log(
        "🔍 AUDIO CHECK FINISHED"
    );

    console.log(
        "================================"
    );
}


// To check all audio files manually:
// Open browser Console and type:
//
// checkAudioFiles()
//
// Then press Enter.