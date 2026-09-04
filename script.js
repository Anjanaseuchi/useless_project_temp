// ============================================================
// CHARGER GUILT
// FULL script.js
// ============================================================


// ============================================================
// HTML ELEMENTS
// ============================================================

const plugButton = document.getElementById("plugButton");
const fullButton = document.getElementById("fullButton");

const batteryText = document.getElementById("batteryText");
const batteryFill = document.getElementById("batteryFill");
const statusText = document.getElementById("statusText");
const character = document.getElementById("character");


// ============================================================
// SETTINGS
// ============================================================

const AUDIO_FOLDER = "audio/";


// Gap between two audio files
const GAP_BETWEEN_AUDIO = 1000;


// How long we wait after the last user activity
// before considering the phone "not being used"
const INACTIVITY_TIME = 5000;


// ============================================================
// STATE
// ============================================================

let battery = null;
let batteryPercent = 0;

let chargingSession = false;
let fullyCharged = false;

let userIsActive = false;

let activityTimer = null;

let currentAudio = null;
let audioPlaying = false;

let audioQueue = [];
let queueIndex = 0;

let queueRunning = false;

let motionEnabled = false;


// ============================================================
// BATTERY-SPECIFIC AUDIO
// ============================================================
//
// These files are NOT common.
//
// They must come BEFORE common audio.
//
// ============================================================

const batteryRangeAudio = [

    // --------------------------------------------------------
    // 10 - 20%
    // --------------------------------------------------------

    {
        min: 10,
        max: 20,

        files: [
            "10-20 low charge(gogo).mp3",
            "10-20(low dialog).mp3",
            "10-20(scream dialog).mp3"
        ]
    },


    // --------------------------------------------------------
    // 20 - 30%
    // --------------------------------------------------------

    {
        min: 20,
        max: 30,

        files: [
            "20-30(yooo).mp3",
            "fahh(20-30).mp3"
        ]
    },


    // --------------------------------------------------------
    // 40 - 60%
    // --------------------------------------------------------

    {
        min: 40,
        max: 60,

        files: [
            "40-60.mp3"
        ]
    },


    // --------------------------------------------------------
    // 70 - 100%
    // --------------------------------------------------------

    {
        min: 70,
        max: 100,

        files: [
            "few minutes(70-100).mp3"
        ]
    }

];


// ============================================================
// EXACT BATTERY AUDIO
// ============================================================
//
// Example:
//
// 50%
// ↓
// scream(50%).mp3
//
// Then range audio.
// Then common audio.
//
// ============================================================

const exactBatteryAudio = {

    50: [
        "scream(50%).mp3"
    ]

};


// ============================================================
// COMMON AUDIO
// ============================================================
//
// VERY IMPORTANT:
//
// This order must NEVER be randomized.
//
// 1
// 2
// 3
// 4
// 5
// 6
// 7
// 8
//
// ============================================================

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


// ============================================================
// REMAINING COMMON AUDIO
// ============================================================
//
// After 1 -> 8 finish, these play.
//
// ============================================================

const remainingCommonAudio = [

    "scolding.mp3",

    "scream 2.mp3",

    "scream1.mp3",

    "scream3.mp3",

    "spiderman-meme-song.mp3",

    "ultimate warning.mp3"

];


// ============================================================
// FULLY CHARGED AUDIO
// ============================================================

const fullyChargedAudio = [

    "(fully charged).mp3"

];


// ============================================================
// WAIT FUNCTION
// ============================================================

function wait(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });

}


// ============================================================
// CHARACTER
// ============================================================

function setCharacter(state) {

    if (!character) return;


    character.className = "character " + state;


    switch (state) {

        case "happy":

            character.textContent = "😺";

            break;


        case "watching":

            character.textContent = "👀";

            break;


        case "annoyed":

            character.textContent = "😒";

            break;


        case "angry":

            character.textContent = "😠";

            break;


        case "rage":

            character.textContent = "🤬";

            break;


        case "celebrate":

            character.textContent = "🥳";

            break;


        default:

            character.textContent = "😺";

    }

}


// ============================================================
// BATTERY UI
// ============================================================

function updateBatteryUI() {

    const percent = Math.round(batteryPercent);


    // --------------------------------------------------------
    // Battery text
    // --------------------------------------------------------

    if (batteryText) {

        batteryText.textContent = percent + "%";

    }


    // --------------------------------------------------------
    // Battery bar
    // --------------------------------------------------------

    if (batteryFill) {

        batteryFill.style.width = percent + "%";

    }


    // --------------------------------------------------------
    // FULLY CHARGED
    // --------------------------------------------------------

    if (percent >= 100) {

        fullyCharged = true;


        // Stop charging session
        chargingSession = false;

        userIsActive = false;


        // Stop any audio
        stopCurrentAudio();


        if (plugButton) {

            plugButton.style.display = "none";

        }


        if (fullButton) {

            fullButton.style.display = "block";

        }


        if (statusText) {

            statusText.textContent =
                "🔋 Fully charged!";

        }


        setCharacter("celebrate");


        return;

    }


    // --------------------------------------------------------
    // BELOW 100%
    // --------------------------------------------------------

    fullyCharged = false;


    if (plugButton) {

        plugButton.style.display = "block";

    }


    if (fullButton) {

        fullButton.style.display = "none";

    }


    if (statusText) {

        statusText.textContent =
            "Ready to judge your phone usage 😼";

    }


    setCharacter("happy");

}


// ============================================================
// GET BATTERY
// ============================================================

async function getBattery() {

    // --------------------------------------------------------
    // Battery API unavailable
    // --------------------------------------------------------

    if (!navigator.getBattery) {

        console.warn(
            "Battery API is not available in this browser."
        );


        batteryPercent = 50;


        if (batteryText) {

            batteryText.textContent =
                "Battery unavailable";

        }


        // Do NOT pretend battery is 100%
        fullyCharged = false;


        if (plugButton) {

            plugButton.style.display = "block";

        }


        if (fullButton) {

            fullButton.style.display = "none";

        }


        return;

    }


    try {

        battery = await navigator.getBattery();


        batteryPercent =
            battery.level * 100;


        updateBatteryUI();


        // ----------------------------------------------------
        // Battery percentage changed
        // ----------------------------------------------------

        battery.addEventListener(
            "levelchange",
            () => {

                const oldPercent =
                    Math.round(batteryPercent);


                batteryPercent =
                    battery.level * 100;


                const newPercent =
                    Math.round(batteryPercent);


                console.log(
                    "🔋 Battery changed:",
                    oldPercent + "%",
                    "→",
                    newPercent + "%"
                );


                // If battery reached 100%
                if (newPercent >= 100) {

                    fullyCharged = true;

                    chargingSession = false;

                    userIsActive = false;

                    stopCurrentAudio();

                    if (plugButton) {

                        plugButton.style.display =
                            "none";

                    }

                    if (fullButton) {

                        fullButton.style.display =
                            "block";

                    }

                    if (statusText) {

                        statusText.textContent =
                            "🔋 Fully charged!";

                    }

                    setCharacter("celebrate");


                } else {

                    fullyCharged = false;

                    updateBatteryUI();

                }

            }
        );


        // ----------------------------------------------------
        // Charging state changed
        // ----------------------------------------------------

        battery.addEventListener(
            "chargingchange",
            () => {

                console.log(
                    "⚡ Charging:",
                    battery.charging
                );

            }
        );


    } catch (error) {

        console.error(
            "Battery detection failed:",
            error
        );


        batteryPercent = 50;

        fullyCharged = false;


        if (batteryText) {

            batteryText.textContent =
                "Battery unavailable";

        }


        if (plugButton) {

            plugButton.style.display =
                "block";

        }

        if (fullButton) {

            fullButton.style.display =
                "none";

        }

    }

}


// ============================================================
// GET EXACT BATTERY AUDIO
// ============================================================

function getExactBatteryAudio(percent) {

    const files = [];


    if (exactBatteryAudio[percent]) {

        files.push(
            ...exactBatteryAudio[percent]
        );

    }


    return files;

}


// ============================================================
// GET RANGE AUDIO
// ============================================================

function getRangeAudio(percent) {

    const files = [];


    for (const range of batteryRangeAudio) {

        if (
            percent >= range.min &&
            percent < range.max
        ) {

            files.push(
                ...range.files
            );

            break;

        }

    }


    return files;

}


// ============================================================
// BUILD CHARGING QUEUE
// ============================================================
//
// FINAL ORDER:
//
// 1. Exact percentage audio
//
// 2. Range audio
//
// 3. Common #1
// 4. Common #2
// 5. Common #3
// 6. Common #4
// 7. Common #5
// 8. Common #6
// 9. Common #7
// 10. Common #8
//
// 11. Remaining common sounds
//
// ============================================================

function buildChargingQueue() {

    const percent =
        Math.round(batteryPercent);


    let queue = [];


    // --------------------------------------------------------
    // STEP 1
    // Exact percentage audio
    // --------------------------------------------------------

    const exactFiles =
        getExactBatteryAudio(percent);


    if (exactFiles.length > 0) {

        console.log(
            "🎯 Exact battery audio:",
            exactFiles
        );


        queue.push(
            ...exactFiles
        );

    }


    // --------------------------------------------------------
    // STEP 2
    // Range audio
    // --------------------------------------------------------

    const rangeFiles =
        getRangeAudio(percent);


    if (rangeFiles.length > 0) {

        console.log(
            "🔋 Range audio:",
            rangeFiles
        );


        queue.push(
            ...rangeFiles
        );

    } else {

        console.log(
            "ℹ️ No specific range audio for",
            percent + "%"
        );

    }


    // --------------------------------------------------------
    // STEP 3
    // Common 1 -> 8
    // --------------------------------------------------------

    queue.push(
        ...numberedCommonAudio
    );


    // --------------------------------------------------------
    // STEP 4
    // Remaining common
    // --------------------------------------------------------

    queue.push(
        ...remainingCommonAudio
    );


    return queue;

}


// ============================================================
// CREATE AUDIO
// ============================================================

function createAudio(filename) {

    const audioElement =
        new Audio(
            AUDIO_FOLDER +
            encodeURIComponent(filename)
        );


    audioElement.preload = "auto";


    return audioElement;

}


// ============================================================
// PLAY ONE AUDIO
// ============================================================
//
// Returns:
//
// "ended"  = audio completed
// "stopped" = user stopped using phone
// "error"  = file couldn't play
//
// ============================================================

async function playOneAudio(filename) {

    if (!chargingSession) {

        return "stopped";

    }


    if (!userIsActive) {

        return "stopped";

    }


    if (fullyCharged) {

        return "stopped";

    }


    return new Promise(resolve => {

        const sound =
            createAudio(filename);


        currentAudio = sound;

        audioPlaying = true;


        // ----------------------------------------------------
        // Character intensity
        // ----------------------------------------------------

        if (queueIndex <= 1) {

            setCharacter("watching");

        }
        else if (queueIndex <= 3) {

            setCharacter("annoyed");

        }
        else if (queueIndex <= 6) {

            setCharacter("angry");

        }
        else {

            setCharacter("rage");

        }


        if (statusText) {

            statusText.textContent =
                "STOP USING YOUR PHONE 😭";

        }


        let finished = false;


        function finish(result) {

            if (finished) return;


            finished = true;


            audioPlaying = false;


            sound.onended = null;

            sound.onerror = null;

            sound.onpause = null;


            if (currentAudio === sound) {

                currentAudio = null;

            }


            resolve(result);

        }


        // ----------------------------------------------------
        // AUDIO FINISHED
        // ----------------------------------------------------

        sound.onended = () => {

            console.log(
                "✅ Finished:",
                filename
            );


            finish("ended");

        };


        // ----------------------------------------------------
        // AUDIO ERROR
        // ----------------------------------------------------

        sound.onerror = () => {

            console.warn(
                "❌ Could not play:",
                filename
            );


            finish("error");

        };


        // ----------------------------------------------------
        // PLAY AUDIO
        // ----------------------------------------------------

        sound.volume = 1.0;


        const playPromise =
            sound.play();


        if (
            playPromise &&
            typeof playPromise.catch === "function"
        ) {

            playPromise.catch(error => {

                console.warn(
                    "⚠️ Playback blocked:",
                    filename,
                    error
                );


                finish("error");

            });

        }

    });

}


// ============================================================
// STOP CURRENT AUDIO
// ============================================================

function stopCurrentAudio() {

    if (!currentAudio) {

        audioPlaying = false;

        return;

    }


    try {

        currentAudio.pause();

        currentAudio.currentTime = 0;

    } catch (error) {

        console.warn(
            "Audio stop error:",
            error
        );

    }


    currentAudio = null;

    audioPlaying = false;

}


// ============================================================
// STOP EVERYTHING
// ============================================================

function stopAllAudio() {

    stopCurrentAudio();


    if (!fullyCharged) {

        if (statusText) {

            statusText.textContent =
                "Phone down... good choice 😌";

        }


        setCharacter("watching");

    }

}


// ============================================================
// PLAY CHARGING QUEUE
// ============================================================

async function playChargingQueue() {

    // Prevent multiple queue loops
    if (queueRunning) {

        return;

    }


    if (!chargingSession) {

        return;

    }


    if (!userIsActive) {

        return;

    }


    if (fullyCharged) {

        return;

    }


    queueRunning = true;


    try {

        // ----------------------------------------------------
        // Build queue only once per session
        // ----------------------------------------------------

        if (audioQueue.length === 0) {

            audioQueue =
                buildChargingQueue();


            queueIndex = 0;


            console.log(
                "🔥 FINAL AUDIO QUEUE:"
            );


            audioQueue.forEach(
                (file, index) => {

                    console.log(
                        index + 1,
                        "→",
                        file
                    );

                }
            );

        }


        // ----------------------------------------------------
        // PLAY QUEUE
        // ----------------------------------------------------

        while (
            chargingSession &&
            !fullyCharged &&
            queueIndex < audioQueue.length
        ) {


            // ------------------------------------------------
            // If user stopped, pause the queue.
            //
            // IMPORTANT:
            // Do NOT increment queueIndex.
            //
            // So when user comes back, the same audio
            // can be played again.
            // ------------------------------------------------

            if (!userIsActive) {

                break;

            }


            const filename =
                audioQueue[queueIndex];


            console.log(
                `▶️ ${queueIndex + 1}/${audioQueue.length}:`,
                filename
            );


            const result =
                await playOneAudio(filename);


            // ------------------------------------------------
            // Audio completed normally
            // ------------------------------------------------

            if (result === "ended") {

                queueIndex++;


                console.log(
                    "➡️ Next audio..."
                );


                // One second silence
                await wait(
                    GAP_BETWEEN_AUDIO
                );


                continue;

            }


            // ------------------------------------------------
            // User stopped / session stopped
            // ------------------------------------------------

            if (result === "stopped") {

                break;

            }


            // ------------------------------------------------
            // File error
            //
            // Skip only broken file and continue.
            // ------------------------------------------------

            if (result === "error") {

                queueIndex++;


                console.log(
                    "⏭️ Skipping broken audio..."
                );


                await wait(300);


                continue;

            }

        }


        // ----------------------------------------------------
        // Queue completely finished
        // ----------------------------------------------------

        if (
            queueIndex >= audioQueue.length &&
            chargingSession &&
            !fullyCharged
        ) {

            if (statusText) {

                statusText.textContent =
                    "I HAVE WARNED YOU ENOUGH 😭";

            }


            setCharacter("rage");

        }


    } finally {

        queueRunning = false;

    }

}


// ============================================================
// USER ACTIVITY
// ============================================================

function userActivity() {

    if (!chargingSession) {

        return;

    }


    if (fullyCharged) {

        return;

    }


    // --------------------------------------------------------
    // User is active
    // --------------------------------------------------------

    userIsActive = true;


    // --------------------------------------------------------
    // Reset inactivity timer
    // --------------------------------------------------------

    clearTimeout(
        activityTimer
    );


    activityTimer =
        setTimeout(() => {

            userIsActive = false;


            stopCurrentAudio();


            if (statusText) {

                statusText.textContent =
                    "Phone down... I'm watching 👀";

            }


            setCharacter("watching");


        }, INACTIVITY_TIME);


    // --------------------------------------------------------
    // Start queue
    // --------------------------------------------------------

    if (!audioPlaying) {

        playChargingQueue();

    }

}


// ============================================================
// USER STOPPED
// ============================================================

function userStoppedActivity() {

    if (!chargingSession) {

        return;

    }


    userIsActive = false;


    clearTimeout(
        activityTimer
    );


    stopCurrentAudio();


    if (statusText) {

        statusText.textContent =
            "Phone down... I'm watching 👀";

    }


    setCharacter("watching");

}


// ============================================================
// START CHARGING SESSION
// ============================================================

async function startChargingSession() {

    // --------------------------------------------------------
    // Don't start if full
    // --------------------------------------------------------

    if (
        fullyCharged ||
        batteryPercent >= 100
    ) {

        return;

    }


    // --------------------------------------------------------
    // Start session
    // --------------------------------------------------------

    chargingSession = true;

    userIsActive = false;


    // Reset queue
    audioQueue = [];

    queueIndex = 0;

    queueRunning = false;


    // --------------------------------------------------------
    // IMPORTANT:
    //
    // Clicking this button DOES NOT play audio.
    //
    // It only starts the charging session.
    // --------------------------------------------------------

    if (statusText) {

        statusText.textContent =
            "Charging started 🔋... put the phone down 😌";

    }


    setCharacter("happy");


    console.log(
        "🔌 CHARGING SESSION STARTED"
    );


    console.log(
        "Battery:",
        Math.round(batteryPercent) + "%"
    );

}


// ============================================================
// JUST PLUGGED IN BUTTON
// ============================================================

if (plugButton) {

    plugButton.addEventListener(
        "click",
        async () => {

            await startChargingSession();


            // Ask for motion permission if necessary
            enableMotionDetection();

        }
    );

}


// ============================================================
// FULLY CHARGED BUTTON
// ============================================================

if (fullButton) {

    fullButton.addEventListener(
        "click",
        async () => {

            // ------------------------------------------------
            // Stop charging mode
            // ------------------------------------------------

            fullyCharged = true;

            chargingSession = false;

            userIsActive = false;


            clearTimeout(
                activityTimer
            );


            stopCurrentAudio();


            if (statusText) {

                statusText.textContent =
                    "FULLY CHARGED!!! 🎉🔋";

            }


            setCharacter("celebrate");


            // ------------------------------------------------
            // Play fully charged audio
            // ------------------------------------------------

            const filename =
                fullyChargedAudio[0];


            console.log(
                "🎉 Playing full-charge audio:",
                filename
            );


            const fullAudio =
                createAudio(filename);


            fullAudio.volume = 1.0;


            try {

                await fullAudio.play();

            } catch (error) {

                console.warn(
                    "Full-charge audio blocked:",
                    error
                );

            }

        }
    );

}


// ============================================================
// TOUCH DETECTION
// ============================================================

document.addEventListener(
    "touchstart",
    userActivity,
    {
        passive: true
    }
);


document.addEventListener(
    "touchmove",
    userActivity,
    {
        passive: true
    }
);


// ============================================================
// POINTER / MOUSE
// ============================================================
//
// Useful for testing on laptop/PC.
//
// ============================================================

document.addEventListener(
    "pointerdown",
    userActivity,
    {
        passive: true
    }
);


document.addEventListener(
    "pointermove",
    userActivity,
    {
        passive: true
    }
);


document.addEventListener(
    "mousemove",
    userActivity,
    {
        passive: true
    }
);


// ============================================================
// SCROLL
// ============================================================

document.addEventListener(
    "scroll",
    userActivity,
    {
        passive: true
    }
);


// ============================================================
// KEYBOARD
// ============================================================

document.addEventListener(
    "keydown",
    userActivity
);


// ============================================================
// SCREEN / TAB VISIBILITY
// ============================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (!chargingSession) {

            return;

        }


        if (document.hidden) {

            // Screen/tab hidden
            userStoppedActivity();

        } else {

            // Screen/tab visible again
            // Wait for actual interaction.

            if (statusText) {

                statusText.textContent =
                    "I SEE YOU 👀";

            }


            setCharacter("watching");

        }

    }
);


// ============================================================
// DEVICE MOTION
// ============================================================

let lastMotionTime = 0;


function handleMotion(event) {

    if (!chargingSession) {

        return;

    }


    if (fullyCharged) {

        return;

    }


    const acceleration =
        event.accelerationIncludingGravity;


    if (!acceleration) {

        return;

    }


    const x =
        acceleration.x || 0;


    const y =
        acceleration.y || 0;


    const z =
        acceleration.z || 0;


    const movement =
        Math.abs(x) +
        Math.abs(y) +
        Math.abs(z);


    const now =
        Date.now();


    // Don't react to every tiny motion event
    if (
        now - lastMotionTime <
        500
    ) {

        return;

    }


    // Phone movement
    if (movement > 18) {

        lastMotionTime =
            now;


        console.log(
            "📱 Phone movement detected"
        );


        userActivity();

    }

}


// ============================================================
// ENABLE MOTION DETECTION
// ============================================================

async function enableMotionDetection() {

    if (motionEnabled) {

        return;

    }


    try {

        // ----------------------------------------------------
        // iPhone / Safari style permission
        // ----------------------------------------------------

        if (
            typeof DeviceMotionEvent !==
            "undefined" &&

            typeof DeviceMotionEvent.requestPermission ===
            "function"
        ) {

            const permission =
                await DeviceMotionEvent.requestPermission();


            if (
                permission ===
                "granted"
            ) {

                window.addEventListener(
                    "devicemotion",
                    handleMotion
                );


                motionEnabled = true;


                console.log(
                    "📱 Motion detection enabled."
                );

            }

        }

        // ----------------------------------------------------
        // Android / browsers without permission request
        // ----------------------------------------------------

        else if (
            typeof DeviceMotionEvent !==
            "undefined"
        ) {

            window.addEventListener(
                "devicemotion",
                handleMotion
            );


            motionEnabled = true;


            console.log(
                "📱 Motion detection enabled."
            );

        }

    } catch (error) {

        console.warn(
            "Motion detection unavailable:",
            error
        );

    }

}


// ============================================================
// INITIALIZE
// ============================================================

async function init() {

    console.log(
        "================================"
    );

    console.log(
        "😼 CHARGER GUILT"
    );

    console.log(
        "Initializing..."
    );

    console.log(
        "================================"
    );


    setCharacter("happy");


    if (statusText) {

        statusText.textContent =
            "Checking battery...";

    }


    await getBattery();


    console.log(
        "🔋 Battery:",
        Math.round(batteryPercent) + "%"
    );


    console.log(
        "😈 Charger Guilt is ready!"
    );


    console.log(
        "================================"
    );

}


// ============================================================
// START
// ============================================================

init();