// --- Exercise 1 State ---
const nodes = [
    { x: 100, y: 80 }, { x: 300, y: 80 }, { x: 150, y: 180 }, { x: 150, y: 330 }, 
    { x: 300, y: 200 }, { x: 260, y: 350 }, { x: 780, y: 350 }, { x: 720, y: 80 }, 
    { x: 650, y: 250 }, { x: 500, y: 300 }, { x: 580, y: 80 }
];

const activeDot = document.getElementById('active-dot');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const speedRange = document.getElementById('speed-range');
const sizeRange = document.getElementById('size-range');

let currentIndex = 0;
let isAnimating = false;
let animationTimeout;

// --- Exercise 2 State ---
let score = 0;
let isEx2Running = false;
const scoreCount = document.getElementById('score-count');
const targetBall = document.getElementById('target-ball');
const gameArea = document.getElementById('game-area');
const ex2StartBtn = document.getElementById('ex2-start-btn');
const ex2ResetBtn = document.getElementById('ex2-reset-btn');

// --- Navigation Elements ---
const navEx1 = document.getElementById('nav-ex1');
const navEx2 = document.getElementById('nav-ex2');
const sectionEx1 = document.getElementById('exercise-1');
const sectionEx2 = document.getElementById('exercise-2');

// --- Theme Elements ---
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

// --- Music Elements ---
const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon');
const musicText = document.getElementById('music-text');

// --- Exercise 1 Logic ---
function updateDotPosition(index) {
    const node = nodes[index];
    activeDot.setAttribute('cx', node.x);
    activeDot.setAttribute('cy', node.y);
    
    document.querySelectorAll('.node').forEach(n => n.classList.remove('glow'));
    const nodeEl = document.getElementById(`node-${index}`);
    if (nodeEl) nodeEl.classList.add('glow');
}

function nextStep() {
    if (!isAnimating) return;
    currentIndex = (currentIndex + 1) % nodes.length;
    updateDotPosition(currentIndex);
    const speed = 2200 - speedRange.value;
    animationTimeout = setTimeout(nextStep, speed);
}

function stopExercise1() {
    isAnimating = false;
    clearTimeout(animationTimeout);
    startBtn.textContent = 'Start Exercise';
}

// --- Exercise 2 Logic ---
function spawnBall() {
    if (!isEx2Running) return;

    const ballSize = 60;
    const padding = 20;
    const maxX = gameArea.clientWidth - ballSize - (padding * 2);
    const maxY = gameArea.clientHeight - ballSize - (padding * 2);

    const randomX = Math.floor(Math.random() * maxX) + padding;
    const randomY = Math.floor(Math.random() * maxY) + padding;

    targetBall.style.left = `${randomX}px`;
    targetBall.style.top = `${randomY}px`;
    targetBall.style.opacity = '0';
    targetBall.style.display = 'flex';
    
    // Smooth entry
    setTimeout(() => {
        if (!isEx2Running) return;
        targetBall.style.opacity = '1';
        targetBall.style.transform = 'scale(1)';
    }, 50);
}

function stopExercise2() {
    isEx2Running = false;
    targetBall.style.display = 'none';
    ex2StartBtn.textContent = 'Resume Exercise';
}

targetBall.addEventListener('click', () => {
    if (!isEx2Running) return;
    score++;
    scoreCount.textContent = score;
    targetBall.style.transform = 'scale(0.5)';
    targetBall.style.opacity = '0';
    setTimeout(spawnBall, 200);
});

ex2StartBtn.addEventListener('click', () => {
    if (isEx2Running) {
        stopExercise2();
    } else {
        isEx2Running = true;
        ex2StartBtn.textContent = 'Pause Exercise';
        spawnBall();
    }
});

ex2ResetBtn.addEventListener('click', () => {
    isEx2Running = false;
    score = 0;
    scoreCount.textContent = score;
    targetBall.style.display = 'none';
    ex2StartBtn.textContent = 'Start Exercise';
});

// --- Navigation Logic ---
function switchExercise(id) {
    if (id === 1) {
        sectionEx1.classList.remove('hidden');
        sectionEx2.classList.add('hidden');
        navEx1.classList.add('active');
        navEx2.classList.remove('active');
        stopExercise2();
    } else {
        sectionEx1.classList.add('hidden');
        sectionEx2.classList.remove('hidden');
        navEx1.classList.remove('active');
        navEx2.classList.add('active');
        stopExercise1();
        // Don't auto-start Ex2 anymore, wait for Start button
    }
}

navEx1.addEventListener('click', () => switchExercise(1));
navEx2.addEventListener('click', () => switchExercise(2));

// --- Global Event Listeners ---
startBtn.addEventListener('click', () => {
    if (isAnimating) {
        stopExercise1();
        startBtn.textContent = 'Resume Exercise';
    } else {
        isAnimating = true;
        startBtn.textContent = 'Pause Exercise';
        nextStep();
    }
});

resetBtn.addEventListener('click', () => {
    stopExercise1();
    currentIndex = 0;
    updateDotPosition(0);
    startBtn.textContent = 'Start Exercise';
});

speedRange.addEventListener('input', () => {
    const speed = 2200 - speedRange.value;
    activeDot.style.transition = `cx ${speed/1000}s ease-in-out, cy ${speed/1000}s ease-in-out`;
});

sizeRange.addEventListener('input', (e) => {
    activeDot.setAttribute('r', e.target.value);
});

// --- Theme Logic ---
function setTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light-theme');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
        localStorage.setItem('theme', 'dark');
    }
}

themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    setTheme(!isLight);
});

// --- Music Logic ---
function updateMusicUI() {
    if (bgMusic.paused) {
        musicIcon.textContent = '🎵';
        musicText.textContent = 'Music On';
        musicToggle.classList.remove('active');
    } else {
        musicIcon.textContent = '🎶';
        musicText.textContent = 'Music Off';
        musicToggle.classList.add('active');
    }
}

musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) {
        bgMusic.play().then(updateMusicUI).catch(err => {
            console.error("Audio playback failed:", err);
            // Most browsers block autoplay without interaction
            alert("Music playback requires user interaction. Click again!");
        });
    } else {
        bgMusic.pause();
        updateMusicUI();
    }
});

// --- Initialization ---
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    setTheme(true);
} else {
    setTheme(false);
}

updateDotPosition(0);
const initialSpeed = 2200 - speedRange.value;
activeDot.style.transition = `cx ${initialSpeed/1000}s ease-in-out, cy ${initialSpeed/1000}s ease-in-out`;
targetBall.style.display = 'none'; // Ensure hidden at start

// Sync music UI with actual state (browser might block autoplay)
updateMusicUI();
// Add listener for case where autoplay starts later or state changes externally
bgMusic.addEventListener('play', updateMusicUI);
bgMusic.addEventListener('pause', updateMusicUI);
