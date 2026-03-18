// --- State Management ---
const appState = {
    currentView: 'home-view',
    theme: 'dark',
    walk: {
        totalTime: 5 * 60, // in seconds (default 5 min)
        timeLeft: 5 * 60,
        isRunning: false,
        intervalId: null
    },
    stretch: {
        isRunning: false,
        currentStepIndex: -1,
        timeLeft: 0,
        intervalId: null,
        routine: [
            { name: "Get Ready", desc: "Find a comfortable spot.", duration: 5, icon: "fa-spa" },
            { name: "Neck Rolls", desc: "Slowly roll your neck in circles.", duration: 30, image: "neck roll.png" },
            { name: "Shoulder Shrugs", desc: "Lift shoulders to ears, then drop.", duration: 30, image: "shoulder shrugs.png" },
            { name: "Arm Cross", desc: "Pull one arm across your chest. Switch at 15s.", duration: 30, image: "arm cross.png" },
            { name: "Torso Twist", desc: "Gently twist your torso left and right.", duration: 30, image: "torso twist.png" },
            { name: "Deep Breaths", desc: "Breathe in deeply, exhale slowly.", duration: 20, image: "deep breathes.png" }
        ]
    }
};

// --- DOM Elements ---
const elements = {
    walk: {
        timeDisplay: document.getElementById('walk-time-display'),
        circle: document.getElementById('walk-progress'),
        startBtn: document.getElementById('walk-start-btn'),
        presetBtns: document.querySelectorAll('.preset-btn')
    },
    stretch: {
        name: document.getElementById('stretch-name'),
        desc: document.getElementById('stretch-desc'),
        icon: document.getElementById('stretch-icon-display'),
        image: document.getElementById('stretch-image-display'),
        timeDisplay: document.getElementById('stretch-time-display'),
        startBtn: document.getElementById('stretch-start-btn'),
        progressBar: document.getElementById('stretch-progress-bar'),
        statusText: document.getElementById('stretch-status-text'),
        card: document.getElementById('stretch-info-card')
    }
};

// --- Initialization ---
const walkCircleRadius = elements.walk.circle.r.baseVal.value;
const walkCircleCircumference = walkCircleRadius * 2 * Math.PI;
elements.walk.circle.style.strokeDasharray = `${walkCircleCircumference} ${walkCircleCircumference}`;
elements.walk.circle.style.strokeDashoffset = walkCircleCircumference;

// --- App Logic ---
const app = {
    switchView: function(viewId) {
        // Pause any running timers when leaving
        if (appState.walk.isRunning) app.toggleWalkTimer();
        if (appState.stretch.isRunning) app.resetStretchRoutine();

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        appState.currentView = viewId;
        
        if (viewId === 'walk-view') {
            app.updateWalkUI();
        }
    },

    toggleTheme: function() {
        const body = document.body;
        const themeIcon = document.getElementById('theme-icon');
        
        if (appState.theme === 'dark') {
            body.setAttribute('data-theme', 'light');
            appState.theme = 'light';
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            body.removeAttribute('data-theme');
            appState.theme = 'dark';
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    },

    // --- Walk Timer Logic ---
    setWalkTime: function(minutes, btnElement) {
        if (appState.walk.isRunning) return; // Prevent changing while running

        appState.walk.totalTime = minutes * 60;
        appState.walk.timeLeft = appState.walk.totalTime;
        
        elements.walk.presetBtns.forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
        
        app.updateWalkUI();
    },

    updateWalkUI: function() {
        const minutes = Math.floor(appState.walk.timeLeft / 60);
        const seconds = appState.walk.timeLeft % 60;
        elements.walk.timeDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const fraction = appState.walk.timeLeft / appState.walk.totalTime;
        const offset = walkCircleCircumference - fraction * walkCircleCircumference;
        elements.walk.circle.style.strokeDashoffset = offset;
    },

    toggleWalkTimer: function() {
        if (appState.walk.isRunning) {
            clearInterval(appState.walk.intervalId);
            appState.walk.isRunning = false;
            elements.walk.startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else {
            if (appState.walk.timeLeft <= 0) {
                app.resetWalkTimer();
            }
            appState.walk.isRunning = true;
            elements.walk.startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            appState.walk.intervalId = setInterval(() => {
                appState.walk.timeLeft--;
                app.updateWalkUI();
                
                if (appState.walk.timeLeft <= 0) {
                    clearInterval(appState.walk.intervalId);
                    appState.walk.isRunning = false;
                    elements.walk.startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
                }
            }, 1000);
        }
    },

    resetWalkTimer: function() {
        clearInterval(appState.walk.intervalId);
        appState.walk.isRunning = false;
        appState.walk.timeLeft = appState.walk.totalTime;
        elements.walk.startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        app.updateWalkUI();
    },

    // --- Stretch Routine Logic ---
    toggleStretchRoutine: function() {
        if (appState.stretch.isRunning) {
            // Pause
            clearInterval(appState.stretch.intervalId);
            appState.stretch.isRunning = false;
            elements.stretch.startBtn.innerHTML = '<i class="fas fa-play"></i> Resume Routine';
            elements.stretch.card.classList.remove('animating');
        } else {
            // Start or Resume
            appState.stretch.isRunning = true;
            elements.stretch.startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Routine';
            
            if (appState.stretch.currentStepIndex === -1) {
                app.nextStretchStep();
            } else {
                elements.stretch.card.classList.add('animating');
                app.startStretchTimer();
            }
        }
    },

    nextStretchStep: function() {
        appState.stretch.currentStepIndex++;
        
        if (appState.stretch.currentStepIndex >= appState.stretch.routine.length) {
            app.finishStretchRoutine();
            return;
        }

        const step = appState.stretch.routine[appState.stretch.currentStepIndex];
        appState.stretch.timeLeft = step.duration;
        
        // Update UI
        elements.stretch.name.innerText = step.name;
        elements.stretch.desc.innerText = step.desc;
        
        if (step.image) {
            elements.stretch.icon.style.display = 'none';
            elements.stretch.image.src = step.image;
            elements.stretch.image.style.display = 'block';
        } else {
            elements.stretch.icon.className = `fas ${step.icon} stretch-icon`;
            elements.stretch.icon.style.display = 'block';
            elements.stretch.image.style.display = 'none';
        }
        
        elements.stretch.statusText.innerText = `Step ${appState.stretch.currentStepIndex + 1} of ${appState.stretch.routine.length}`;
        elements.stretch.card.classList.add('animating');
        
        // Update Progress bar
        const progressPercentage = (appState.stretch.currentStepIndex / appState.stretch.routine.length) * 100;
        elements.stretch.progressBar.style.width = `${progressPercentage}%`;

        app.updateStretchUI();
        app.startStretchTimer();
    },

    startStretchTimer: function() {
        clearInterval(appState.stretch.intervalId);
        appState.stretch.intervalId = setInterval(() => {
            appState.stretch.timeLeft--;
            app.updateStretchUI();
            
            if (appState.stretch.timeLeft <= 0) {
                clearInterval(appState.stretch.intervalId);
                app.nextStretchStep();
            }
        }, 1000);
    },

    updateStretchUI: function() {
        const minutes = Math.floor(appState.stretch.timeLeft / 60);
        const seconds = appState.stretch.timeLeft % 60;
        elements.stretch.timeDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    finishStretchRoutine: function() {
        clearInterval(appState.stretch.intervalId);
        appState.stretch.isRunning = false;
        appState.stretch.currentStepIndex = -1;
        
        elements.stretch.name.innerText = "Routine Complete!";
        elements.stretch.desc.innerText = "Great job! You've taken time for yourself.";
        elements.stretch.icon.className = "fas fa-check-circle stretch-icon";
        elements.stretch.icon.style.display = 'block';
        elements.stretch.image.style.display = 'none';
        elements.stretch.timeDisplay.innerText = "00:00";
        elements.stretch.progressBar.style.width = "100%";
        elements.stretch.statusText.innerText = "Well done.";
        elements.stretch.card.classList.remove('animating');
        
        elements.stretch.startBtn.innerHTML = '<i class="fas fa-redo"></i> Do it again';
    },

    resetStretchRoutine: function() {
        clearInterval(appState.stretch.intervalId);
        appState.stretch.isRunning = false;
        appState.stretch.currentStepIndex = -1;
        
        elements.stretch.name.innerText = "Ready to relax?";
        elements.stretch.desc.innerText = "Follow the instructions for each stretch.";
        elements.stretch.icon.className = "fas fa-spa stretch-icon";
        elements.stretch.icon.style.display = 'block';
        elements.stretch.image.style.display = 'none';
        elements.stretch.timeDisplay.innerText = "00:30";
        elements.stretch.progressBar.style.width = "0%";
        elements.stretch.statusText.innerText = "Press Start to begin";
        elements.stretch.card.classList.remove('animating');
        
        elements.stretch.startBtn.innerHTML = '<i class="fas fa-play"></i> Start Routine';
    }
};

// Init UI securely
app.updateWalkUI();
