// ======================================================
// CHARGER GUILT
// FULL SCRIPT - MATCHES CURRENT index.html
// FIXED: audio filenames corrected to match actual files
//   - "10-20 low charge (gogo).mp3" -> "10-20  low charge.(gogo)mp3"
//   - "few minutes(70-100).mp3" -> "few  iminutes(70-100).mp3"
//   - Assumes you renamed these 3 broken files to add the missing dot:
//       dialog what the hell (7)mp3  -> dialog what the hell (7).mp3
//       kanchana(8)mp3               -> kanchana(8).mp3
//       sad-meow(2)-mp3              -> sad-meow(2)-.mp3
//     (they showed a generic file icon in VS Code, not an audio icon,
//     meaning the browser can't recognize them as mp3s as-is)
//   - "scream(50%).mp3" was not visible in your audio folder screenshot.
//     Verify it exists, or update/remove that entry.
// ======================================================


// ======================================================
// HTML ELEMENTS
// ======================================================

const chargingStatus = document.getElementById("chargingStatus");

const batteryPercent = document.getElementById("batteryPercent");
const batteryFill = document.getElementById("batteryFill");
const batteryMessage = document.getElementById("batteryMessage");

const character = document.getElementById("character");
const angerEffects = document.getElementById("angerEffects");
const speechBubble = document.getElementById("speechBubble");
const characterStatus = document.getElementById("characterStatus");

const chargingAction = document.getElementById("chargingAction");
const plugButton = document.getElementById("plugButton");

const fullyChargedAction =
    document.getElementById("fullyChargedAction");

const fullyChargedButton =
    document.getElementById("fullyChargedButton");

const sessionText =
    document.getElementById("sessionText");

const usageStatus =
    document.getElementById("usageStatus");

const usageFill =
    document.getElementById("usageFill");

const usageMessage =
    document.getElementById("usageMessage");

const audioStatus =
    document.getElementById("audioStatus");

const audioName =
    document.getElementById("audioName");


// ======================================================
// SETTINGS
// ======================================================

const AUDIO_FOLDER = "audio/";

const INACTIVITY_TIME = 5000;

const AUDIO_GAP = 1000;

// How often the character advances to the next anger level
// while you stay continuously active. The steps repeat in a
// loop instead of stopping once they reach the angriest one.

const ESCALATION_STEP_TIME = 4000;

const escalationSteps = [

    {
        state: "annoyed",
        bubble: "HEY! I SAW THAT! 😾",
        status: "Why are you using your phone?!"
    },

    {
        state: "angry",
        bubble: "SERIOUSLY?! PUT IT DOWN!",
        status: "You're really testing me right now."
    },

    {
        state: "rage",
        bubble: "THAT'S IT! I'M FURIOUS!",
        status: "This is now personal."
    }

];


// ======================================================
// STATE
// ======================================================

let batteryLevel = 50;

let chargingStarted = false;

let userIsActive = false;

let inactivityTimer = null;

let currentAudio = null;

let currentAudioResolve = null;

let escalationInterval = null;

let escalationIndex = 0;

let audioQueue = [];

let queueIndex = 0;

let queueRunning = false;


// ======================================================
// AUDIO FILES
// ======================================================


// ---------- BATTERY RANGE AUDIO ----------

const batteryRangeAudio = [

    {
        min: 10,
        max: 20,

        files: [
            "10-20  low charge.(gogo).mp3",
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
            "few  iminutes(70-100).mp3"
        ]
    }

];


// ---------- EXACT BATTERY AUDIO ----------

const exactBatteryAudio = {

    // "scream(50%).mp3" removed — file does not exist in your audio folder.
    // Add an entry here if/when you create a real file for it, e.g.:
    // 50: ["your-real-filename.mp3"]

};


// ---------- COMMON NUMBERED AUDIO ----------

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


// ---------- REMAINING COMMON AUDIO ----------

const remainingCommonAudio = [

    "scolding.mp3",

    "scream 2.mp3",

    "scream1.mp3",

    "scream3.mp3",

    "spiderman-meme-song.mp3",

    "ultimate warning.mp3"

];


// ---------- 100% ONLY AUDIO ----------

const fullBatteryAudio = [

    "100%.mp3",

    "100% 2nd audio.mp3"

];


// ---------- FULLY CHARGED BUTTON AUDIO ----------

const fullyChargedAudio = [

    "(fully charged).mp3"

];


// ======================================================
// HELPER
// ======================================================

function audioURL(filename) {

    return AUDIO_FOLDER +
        encodeURIComponent(filename);

}


// ======================================================
// CHARACTER STATE
// ======================================================

function setCharacterState(state) {

    character.classList.remove(
        "happy",
        "watching",
        "annoyed",
        "angry",
        "rage",
        "celebrate"
    );

    character.classList.add(state);


    // The animation classes above only control movement —
    // they never change the emoji itself. Do that here.

    const stateEmoji = {
        happy: "😊",
        watching: "👀",
        annoyed: "😒",
        angry: "😠",
        rage: "🤬",
        celebrate: "🎉"
    };


    if (stateEmoji[state]) {

        character.textContent =
            stateEmoji[state];

    }

}


// ======================================================
// STOP AUDIO
// ======================================================

function stopCurrentAudio() {

    if (currentAudio) {

        currentAudio.pause();

        currentAudio.currentTime = 0;

        currentAudio = null;
    }


    audioStatus.textContent = "Silent";

    audioName.textContent = "No voice playing";


    // IMPORTANT: if we're interrupting a playAudio() call that's
    // still awaiting onended/onerror, resolve it now so the
    // caller (the while loop in playChargingQueue) doesn't hang
    // forever. Without this, forced stops (inactivity timeout,
    // tab hidden, etc.) freeze the queue permanently.

    if (currentAudioResolve) {

        const resolve = currentAudioResolve;

        currentAudioResolve = null;

        resolve(false);

    }

}


// ======================================================
// WAIT
// ======================================================

function wait(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });

}


// ======================================================
// PLAY ONE AUDIO
// ======================================================

function playAudio(filename) {

    return new Promise(resolve => {

        stopCurrentAudio();


        const audio =
            new Audio(audioURL(filename));


        currentAudio = audio;

        currentAudioResolve = resolve;


        audio.volume = 1.0;


        audioStatus.textContent =
            "Speaking 😾";


        audioName.textContent =
            filename;


        audio.onended = () => {

            if (currentAudio === audio) {

                currentAudio = null;
            }


            if (currentAudioResolve === resolve) {

                currentAudioResolve = null;
            }


            audioStatus.textContent =
                "Silent";


            audioName.textContent =
                "No voice playing";


            resolve(true);

        };


        audio.onerror = () => {

            console.error(
                "❌ AUDIO FAILED:",
                filename
            );


            console.error(
                "URL:",
                audioURL(filename)
            );


            if (currentAudio === audio) {

                currentAudio = null;
            }


            if (currentAudioResolve === resolve) {

                currentAudioResolve = null;
            }


            audioStatus.textContent =
                "Audio error";


            audioName.textContent =
                filename;


            resolve(false);

        };


        const promise = audio.play();


        if (promise !== undefined) {

            promise.catch(error => {

                console.warn(
                    "⚠️ Cannot play:",
                    filename,
                    error
                );


                if (currentAudio === audio) {

                    currentAudio = null;
                }


                if (currentAudioResolve === resolve) {

                    currentAudioResolve = null;
                }


                resolve(false);

            });

        }

    });

}


// ======================================================
// GET EXACT BATTERY AUDIO
// ======================================================

function getExactBatteryAudio(percent) {

    if (
        Object.prototype.hasOwnProperty.call(
            exactBatteryAudio,
            percent
        )
    ) {

        return [
            ...exactBatteryAudio[percent]
        ];

    }


    return [];

}


// ======================================================
// GET RANGE AUDIO
// ======================================================

function getRangeBatteryAudio(percent) {

    const result = [];


    for (
        const range
        of batteryRangeAudio
    ) {

        if (
            percent >= range.min &&
            percent < range.max
        ) {

            result.push(
                ...range.files
            );

        }

    }


    return result;

}


// ======================================================
// BUILD QUEUE
// ======================================================

function buildAudioQueue(percent) {

    const queue = [];


    // --------------------------------------
    // 1. EXACT BATTERY AUDIO
    // --------------------------------------

    queue.push(
        ...getExactBatteryAudio(percent)
    );


    // --------------------------------------
    // 2. RANGE BATTERY AUDIO
    // --------------------------------------

    queue.push(
        ...getRangeBatteryAudio(percent)
    );


    // --------------------------------------
    // 3. NUMBERED COMMON AUDIO
    // --------------------------------------

    queue.push(
        ...numberedCommonAudio
    );


    // --------------------------------------
    // 4. REMAINING COMMON AUDIO
    // --------------------------------------

    queue.push(
        ...remainingCommonAudio
    );


    return queue;

}


// ======================================================
// START AUDIO QUEUE
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


    while (
        chargingStarted &&
        userIsActive &&
        batteryLevel < 100
    ) {


        if (
            audioQueue.length === 0
        ) {

            audioQueue =
                buildAudioQueue(
                    batteryLevel
                );

            queueIndex = 0;

        }


        if (
            queueIndex >=
            audioQueue.length
        ) {

            // Restart from beginning
            queueIndex = 0;

        }


        const filename =
            audioQueue[queueIndex];


        console.log(
            "🔊 PLAYING:",
            filename
        );


        await playAudio(filename);


        queueIndex++;


        if (
            !chargingStarted ||
            !userIsActive ||
            batteryLevel >= 100
        ) {

            break;

        }


        await wait(AUDIO_GAP);

    }


    queueRunning = false;


    stopCurrentAudio();

}


// ======================================================
// APPLY ESCALATION STEP
// ======================================================

function applyEscalationStep() {

    const step = escalationSteps[escalationIndex];


    setCharacterState(step.state);


    speechBubble.textContent = step.bubble;


    characterStatus.textContent = step.status;

}


// ======================================================
// USER ACTIVE
// ======================================================

function userBecameActive() {

    if (!chargingStarted) {
        return;
    }


    if (batteryLevel >= 100) {
        return;
    }


    const justBecameActive = !userIsActive;


    userIsActive = true;


    clearTimeout(
        inactivityTimer
    );


    if (justBecameActive) {

        // Fresh "caught using phone" moment — restart the loop
        // from the first (mildest) anger step.

        clearInterval(escalationInterval);


        escalationIndex = 0;


        applyEscalationStep();


        escalationInterval = setInterval(() => {

            if (!userIsActive) {
                return;
            }

            escalationIndex =
                (escalationIndex + 1) %
                escalationSteps.length;

            applyEscalationStep();

        }, ESCALATION_STEP_TIME);

    }


    angerEffects.classList.add(
        "show"
    );


    // UI


    usageStatus.textContent =
        "Using phone 📱";


    usageFill.style.width =
        "100%";


    usageMessage.textContent =
        "PUT IT DOWN! 😾";


    audioStatus.textContent =
        "Watching you 👀";


    console.log(
        "📱 USER ACTIVE"
    );


    playChargingQueue();

}


// ======================================================
// USER INACTIVE
// ======================================================

function userBecameInactive() {

    clearTimeout(
        inactivityTimer
    );


    inactivityTimer =
        setTimeout(() => {


            userIsActive = false;


            clearInterval(escalationInterval);


            stopCurrentAudio();


            setCharacterState(
                "watching"
            );


            angerEffects.classList.remove(
                "show"
            );


            speechBubble.textContent =
                "Hehe... charging peacefully 😺";


            characterStatus.textContent =
                "Your phone is resting.";


            usageStatus.textContent =
                "Not using";


            usageFill.style.width =
                "0%";


            usageMessage.textContent =
                "Put the phone down and let it charge.";


            audioStatus.textContent =
                "Silent";


            audioName.textContent =
                "No voice playing";


            console.log(
                "😴 USER INACTIVE"
            );


        }, INACTIVITY_TIME);

}


// ======================================================
// ACTIVITY DETECTED
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
// TOUCH EVENTS
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
// MOUSE EVENTS
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
// VISIBILITY
// ======================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

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
// MOTION DETECTION
// ======================================================

function handleMotion(event) {

    if (!chargingStarted) {
        return;
    }


    if (batteryLevel >= 100) {
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
        Math.sqrt(
            x * x +
            y * y +
            z * z
        );


    if (movement > 12) {

        activityDetected();

    }

}


// ======================================================
// MOTION SETUP
// ======================================================

async function setupMotionDetection() {

    if (
        typeof DeviceMotionEvent !==
        "undefined"
    ) {


        if (
            typeof DeviceMotionEvent.requestPermission ===
            "function"
        ) {


            document.addEventListener(
                "click",
                async () => {

                    try {

                        const permission =
                            await DeviceMotionEvent
                                .requestPermission();


                        if (
                            permission ===
                            "granted"
                        ) {

                            window.addEventListener(
                                "devicemotion",
                                handleMotion,
                                {
                                    passive: true
                                }
                            );


                            console.log(
                                "✅ Motion enabled"
                            );

                        }

                    } catch (error) {

                        console.warn(
                            "Motion permission failed:",
                            error
                        );

                    }

                },
                {
                    once: true
                }
            );


        } else {


            window.addEventListener(
                "devicemotion",
                handleMotion,
                {
                    passive: true
                }
            );


            console.log(
                "✅ Motion listener enabled"
            );

        }

    }

}


// ======================================================
// UPDATE BATTERY UI
// ======================================================

function updateBatteryUI(level) {

    batteryLevel =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(level)
            )
        );


    batteryPercent.textContent =
        batteryLevel + "%";


    batteryFill.style.width =
        batteryLevel + "%";


    // --------------------------------------
    // 100%
    // --------------------------------------

    if (batteryLevel >= 100) {


        batteryLevel = 100;


        batteryPercent.textContent =
            "100%";


        batteryFill.style.width =
            "100%";


        chargingStarted = false;

        userIsActive = false;


        clearTimeout(
            inactivityTimer
        );


        stopCurrentAudio();


        audioQueue = [];

        queueIndex = 0;

        queueRunning = false;


        chargingAction.classList.add(
            "hidden"
        );


        fullyChargedAction.classList.remove(
            "hidden"
        );


        chargingStatus.textContent =
            "Fully Charged 🎉";


        batteryMessage.textContent =
            "Your battery is full!";


        setCharacterState(
            "celebrate"
        );


        angerEffects.classList.remove(
            "show"
        );


        speechBubble.textContent =
            "YAY! FULLY CHARGED! 🎉";


        characterStatus.textContent =
            "Battery is at 100%.";


        usageStatus.textContent =
            "Not using";


        usageFill.style.width =
            "0%";


        usageMessage.textContent =
            "Charging complete.";


        return;

    }


    // --------------------------------------
    // BELOW 100%
    // --------------------------------------

    chargingAction.classList.remove(
        "hidden"
    );


    fullyChargedAction.classList.add(
        "hidden"
    );


    chargingStatus.textContent =
        "Ready to charge 🔌";


    batteryMessage.textContent =
        "Your phone needs some charging.";


    if (!chargingStarted) {


        setCharacterState(
            "happy"
        );


        speechBubble.textContent =
            "Hehe... charging peacefully 😺";


        characterStatus.textContent =
            "Your phone is resting.";

    }


}


// ======================================================
// BATTERY API
// ======================================================

async function setupBattery() {


    // --------------------------------------
    // REAL BATTERY API
    // --------------------------------------

    if (
        "getBattery" in navigator
    ) {


        try {


            const battery =
                await navigator.getBattery();


            function updateRealBattery() {


                const level =
                    Math.round(
                        battery.level * 100
                    );


                updateBatteryUI(level);


                chargingStatus.textContent =
                    battery.charging
                        ? "Charging ⚡"
                        : "Not charging";


                console.log(
                    "🔋 REAL BATTERY:",
                    level + "%",
                    "Charging:",
                    battery.charging
                );

            }


            updateRealBattery();


            battery.addEventListener(
                "levelchange",
                updateRealBattery
            );


            battery.addEventListener(
                "chargingchange",
                () => {


                    console.log(
                        "⚡ Charging changed:",
                        battery.charging
                    );


                    if (
                        battery.charging
                    ) {


                        if (
                            battery.level *
                            100 < 100
                        ) {

                            chargingStatus.textContent =
                                "Charging ⚡";

                        }


                    } else {


                        chargingStatus.textContent =
                            "Not charging";


                        chargingStarted =
                            false;


                        userIsActive =
                            false;


                        stopCurrentAudio();


                        clearTimeout(
                            inactivityTimer
                        );

                    }

                }
            );


            console.log(
                "✅ Real Battery API working"
            );


            return;


        } catch (error) {


            console.warn(
                "⚠️ Battery API error:",
                error
            );

        }

    }


    // --------------------------------------
    // TEST MODE
    // --------------------------------------

    console.warn(
        "⚠️ Battery API unavailable."
    );


    batteryLevel = 50;


    updateBatteryUI(50);


    batteryPercent.textContent =
        "50%";


    batteryMessage.textContent =
        "50% TEST MODE";


    chargingStatus.textContent =
        "Test Mode 🔋";


    console.log(
        "🧪 TEST BATTERY = 50%"
    );

}


// ======================================================
// JUST PLUGGED IN
// ======================================================

plugButton.addEventListener(
    "click",
    () => {


        console.log(
            "🔌 JUST PLUGGED IN"
        );


        chargingStarted = true;


        userIsActive = false;


        clearTimeout(
            inactivityTimer
        );


        stopCurrentAudio();


        // Build fresh queue
        audioQueue =
            buildAudioQueue(
                batteryLevel
            );


        queueIndex = 0;


        queueRunning = false;


        // UI

        setCharacterState(
            "watching"
        );


        angerEffects.classList.remove(
            "show"
        );


        speechBubble.textContent =
            "I'm watching you... 👀";


        characterStatus.textContent =
            "Don't touch your phone.";


        usageStatus.textContent =
            "Not using";


        usageFill.style.width =
            "0%";


        usageMessage.textContent =
            "Put the phone down and let it charge.";


        chargingStatus.textContent =
            "Charging ⚡";


        sessionText.textContent =
            "Session started. I'm watching... 👀";


        audioStatus.textContent =
            "Silent";


        audioName.textContent =
            "No voice playing";


        // IMPORTANT:
        // NO AUDIO HERE.
        //
        // Audio starts only when
        // activity is detected.

    }
);


// ======================================================
// FULLY CHARGED BUTTON
// ======================================================

fullyChargedButton.addEventListener(
    "click",
    async () => {


        console.log(
            "🥳 FULLY CHARGED BUTTON"
        );


        stopCurrentAudio();


        chargingStarted = false;


        userIsActive = false;


        clearTimeout(
            inactivityTimer
        );


        setCharacterState(
            "celebrate"
        );


        angerEffects.classList.remove(
            "show"
        );


        speechBubble.textContent =
            "YAY! YOU MADE IT! 🎉🔋";


        characterStatus.textContent =
            "Your phone is fully charged!";


        usageStatus.textContent =
            "Not using";


        usageFill.style.width =
            "0%";


        usageMessage.textContent =
            "Charging complete!";


        audioStatus.textContent =
            "Celebrating 🎉";


        // Play the dedicated full-charge sound

        for (
            const filename
            of fullyChargedAudio
        ) {


            await playAudio(
                filename
            );


            await wait(500);

        }

    }
);


// ======================================================
// INITIAL PAGE
// ======================================================

function initializePage() {


    chargingStatus.textContent =
        "Checking...";


    batteryPercent.textContent =
        "--%";


    batteryFill.style.width =
        "0%";


    batteryMessage.textContent =
        "Checking your battery...";


    setCharacterState(
        "happy"
    );


    angerEffects.classList.remove(
        "show"
    );


    speechBubble.textContent =
        "Hehe... charging peacefully 😺";


    characterStatus.textContent =
        "Your phone is resting.";


    usageStatus.textContent =
        "Not using";


    usageFill.style.width =
        "0%";


    usageMessage.textContent =
        "Put the phone down and let it charge.";


    audioStatus.textContent =
        "Silent";


    audioName.textContent =
        "No voice playing";


    chargingAction.classList.remove(
        "hidden"
    );


    fullyChargedAction.classList.add(
        "hidden"
    );

}


// ======================================================
// START APP
// ======================================================

initializePage();

setupMotionDetection();

setupBattery();


// ======================================================
// AUDIO DIAGNOSTIC
// Run checkAudioFiles() in the browser console to verify
// every filename actually resolves before relying on it.
// ======================================================

async function checkAudioFiles() {


    console.clear();


    console.log(
        "===================================="
    );


    console.log(
        "🔍 CHECKING ALL AUDIO FILES"
    );


    console.log(
        "===================================="
    );


    const allFiles = new Set();


    // Range audio

    for (
        const range
        of batteryRangeAudio
    ) {

        range.files.forEach(
            file => allFiles.add(file)
        );

    }


    // Exact audio

    Object.values(
        exactBatteryAudio
    ).forEach(files => {

        files.forEach(
            file => allFiles.add(file)
        );

    });


    // Common

    numberedCommonAudio.forEach(
        file => allFiles.add(file)
    );


    remainingCommonAudio.forEach(
        file => allFiles.add(file)
    );


    // 100%

    fullBatteryAudio.forEach(
        file => allFiles.add(file)
    );


    // Fully charged

    fullyChargedAudio.forEach(
        file => allFiles.add(file)
    );


    let working = 0;

    let failed = 0;


    for (
        const filename
        of allFiles
    ) {


        await new Promise(resolve => {


            const audio =
                new Audio(
                    audioURL(filename)
                );


            audio.addEventListener(
                "canplaythrough",
                () => {


                    console.log(
                        "✅ WORKING:",
                        filename
                    );


                    working++;


                    resolve();

                },
                {
                    once: true
                }
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
                        audioURL(filename)
                    );


                    failed++;


                    resolve();

                },
                {
                    once: true
                }
            );


            audio.load();

        });

    }


    console.log(
        "===================================="
    );


    console.log(
        "✅ WORKING:",
        working
    );


    console.log(
        "❌ FAILED:",
        failed
    );


    console.log(
        "===================================="
    );

}