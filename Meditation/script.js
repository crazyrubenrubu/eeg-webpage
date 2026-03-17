const text = document.getElementById("text")
const affirmationText = document.getElementById("affirmation")

const totalTime = 10000
const breatheTime = 4000
const holdTime = 2000
const music = document.getElementById("music-music")

let breatheInterval = null;
let timeout1 = null;
let timeout2 = null;

// Affirmations list
const affirmations = [
"I am calm and at peace.",
"I feel balanced and grounded.",
"My mind is clear and relaxed.",
"I welcome peace into my life.",
"I am present in this moment.",
"My breath brings me calm.",
"I release stress and tension.",
"I am safe, calm, and centered.",
"Peace flows through me.",
"I trust myself and my journey.",
"I am grateful for this moment.",
"My mind and body are in harmony."
]

let affirmationIndex = 0

// Initial state
text.innerText = "Ready to Begin"
affirmationText.innerText = affirmations[0]

function changeAffirmation(){
    affirmationIndex++
    
    if(affirmationIndex >= affirmations.length){
        affirmationIndex = 0
    }

    affirmationText.innerText = affirmations[affirmationIndex]
}

function breathAnimation(){

text.innerText = "Breathe In"

timeout1 = setTimeout(()=>{
text.innerText = "Hold"
},breatheTime)

timeout2 = setTimeout(()=>{
text.innerText = "Breathe Out"
},breatheTime + holdTime)

// change quote every breathing cycle
changeAffirmation()
}

function stopAnimation(){
    clearInterval(breatheInterval);
    clearTimeout(timeout1);
    clearTimeout(timeout2);
    text.innerText = "Ready to Begin"
    
    const rings = document.querySelectorAll('.ring');
    rings.forEach(ring => {
        ring.style.animationPlayState = 'paused';
    });
}

function startAnimation() {
    breathAnimation();
    breatheInterval = setInterval(breathAnimation,totalTime)
    
    const rings = document.querySelectorAll('.ring');
    rings.forEach(ring => {
        ring.style.animationPlayState = 'running';
    });
}

// Stopwatch Logic
let stopwatchInterval;
let elapsedTime = 0;
let isRunning = false;

const timeDisplay = document.getElementById('time-display');
const startStopBtn = document.getElementById('start-stop-btn');
const resetBtn = document.getElementById('reset-btn');

function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    return `${formattedMinutes}:${formattedSeconds}`;
}

function updateDisplay() {
    timeDisplay.innerText = formatTime(elapsedTime);
}

startStopBtn.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(stopwatchInterval);
        startStopBtn.innerText = 'Start';
        stopAnimation();
        music.pause();   // stop music
    } else {
        stopwatchInterval = setInterval(() => {
            elapsedTime++;
            updateDisplay();
        }, 1000);

        startStopBtn.innerText = 'Stop';
        startAnimation();
        music.play();   // start music
    }

    isRunning = !isRunning;
   
});

resetBtn.addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    elapsedTime = 0;
    isRunning = false;
    startStopBtn.innerText = 'Start';
    updateDisplay();
    stopAnimation();

    music.pause();
    music.currentTime = 0;
});