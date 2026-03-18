const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const exerciseImage = document.getElementById('exercise-image');
const musicPlayBtn = document.getElementById('music-play-btn');
const musicStopBtn = document.getElementById('music-stop-btn');
const bgMusic = document.getElementById('bg-music');

let totalTime = 5 * 60; // 5 minutes in seconds
let timeRemaining = totalTime;
let timerInterval = null;
let isRunning = false;

// Image logic
const images = ['Exercise1.png', 'Exercise2.png', 'Exercise3.png', 'Exercise4.png'];
let currentImageIndex = 0;
const IMAGE_CHANGE_INTERVAL = 10; // 10 seconds
let secondsSinceLastImageChange = 0;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateImageDisplay() {
    // Fade out
    exerciseImage.classList.add('fade-out');
    
    // Change source after fade out completes
    setTimeout(() => {
        exerciseImage.src = images[currentImageIndex];
        // Fade back in
        exerciseImage.classList.remove('fade-out');
    }, 500); // Wait for CSS transition (0.5s)
}

function updateTimer() {
    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        bgMusic.pause();
        
        // Reset to first normal image
        exerciseImage.src = '1st.png';
        return;
    }

    timeRemaining--;
    timerDisplay.textContent = formatTime(timeRemaining);
    
    // Handle image rotation
    secondsSinceLastImageChange++;
    if (secondsSinceLastImageChange >= IMAGE_CHANGE_INTERVAL) {
        secondsSinceLastImageChange = 0;
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateImageDisplay();
    }
}

startBtn.addEventListener('click', () => {
    if (!isRunning) {
        if (timeRemaining === totalTime) {
            // First start or after reset, change to first exercise image
            currentImageIndex = 0;
            secondsSinceLastImageChange = 0;
            updateImageDisplay();
        }
        
        isRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        // Auto-play music if not already playing
        if (bgMusic.paused) {
            bgMusic.play().catch(e => console.log("Audio play prevented by browser", e));
        }
    }
});

pauseBtn.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
});

resetBtn.addEventListener('click', () => {
    isRunning = false;
    clearInterval(timerInterval);
    
    timeRemaining = totalTime;
    timerDisplay.textContent = formatTime(timeRemaining);
    
    // Reset image to normal
    exerciseImage.classList.add('fade-out');
    setTimeout(() => {
        exerciseImage.src = '1st.png';
        exerciseImage.classList.remove('fade-out');
    }, 500);
    
    secondsSinceLastImageChange = 0;
    currentImageIndex = 0;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
});

musicPlayBtn.addEventListener('click', () => {
    bgMusic.play().catch(e => console.log("Audio play prevented", e));
});

musicStopBtn.addEventListener('click', () => {
    bgMusic.pause();
    bgMusic.currentTime = 0; // Reset music to start
});
