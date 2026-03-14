// dashboard.js – Full EEG monitor logic
const wsUrl = 'ws://localhost:8080';
let socket = null;
let monitoring = false;
let secondsElapsed = 0;
let timerInterval = null;
let simInterval = null;
let useSimulated = false;
let isConnected = false;
let reconnectAttempts = 0;
const maxReconnect = 5;

let dataReceived = false;
let bandHistory = [];

// DOM elements
const connectionStatus = document.getElementById('connectionStatus');
const streamStatus = document.getElementById('streamStatus');
const mainAction = document.getElementById('mainActionBtn');
const timerDisplay = document.getElementById('timerDisplay');
const deltaVal = document.getElementById('deltaVal');
const thetaVal = document.getElementById('thetaVal');
const alphaVal = document.getElementById('alphaVal');
const betaVal = document.getElementById('betaVal');
const gammaVal = document.getElementById('gammaVal');
const signalQuality = document.getElementById('signalQuality');
const qualityText = document.getElementById('qualityText');
const sampleInfo = document.getElementById('sampleInfo');
const diagnosticText = document.getElementById('diagnosticText');
const recentList = document.getElementById('recentList');
const overlay = document.getElementById('resultOverlay');
const overlayCondition = document.getElementById('overlayCondition');
const solutionsContent = document.getElementById('solutionsContent');
const brainIcon = document.getElementById('brainIcon');
const wsUrlBox = document.getElementById('wsUrlBox');
const diagnosticSolutionsBtn = document.getElementById('diagnosticSolutionsBtn');
const liveBtn = document.getElementById('liveBtn');
const simBtn = document.getElementById('simBtn');
const canvas = document.getElementById('eegCanvas');

// Brain state parameters
const brainStateParams = document.getElementById('brainStateParams');
const deltaPercent = document.getElementById('deltaPercent');
const thetaPercent = document.getElementById('thetaPercent');
const alphaPercent = document.getElementById('alphaPercent');
const betaPercent = document.getElementById('betaPercent');
const gammaPercent = document.getElementById('gammaPercent');
const dominantBandSpan = document.getElementById('dominantBand').querySelector('strong');
const detectedStateParam = document.getElementById('detectedStateParam').querySelector('strong');

// Band items for highlight
const bandItems = {
    delta: document.getElementById('deltaItem'),
    theta: document.getElementById('thetaItem'),
    alpha: document.getElementById('alphaItem'),
    beta: document.getElementById('betaItem'),
    gamma: document.getElementById('gammaItem')
};

let recentSessions = [];

// ---------- Reset UI on disconnect ----------
function resetUI() {
    deltaVal.innerText = '0.00';
    thetaVal.innerText = '0.00';
    alphaVal.innerText = '0.00';
    betaVal.innerText = '0.00';
    gammaVal.innerText = '0.00';
    signalQuality.innerText = '0.0';
    qualityText.innerText = '0.0% estimated';
    sampleInfo.innerText = 'Samples: 0 · latest: 0.00';

    deltaPercent.innerText = '0.0%';
    thetaPercent.innerText = '0.0%';
    alphaPercent.innerText = '0.0%';
    betaPercent.innerText = '0.0%';
    gammaPercent.innerText = '0.0%';
    dominantBandSpan.innerText = 'DELTA';
    detectedStateParam.innerText = 'Waiting for data...';

    if (window.resetBandWaveforms) {
        window.resetBandWaveforms();
    }

    bandHistory = [];
    dataReceived = false;
}

// ---------- WebSocket ----------
function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) return;
    socket = new WebSocket(wsUrl);
    socket.onopen = () => {
        isConnected = true;
        reconnectAttempts = 0;
        connectionStatus.innerText = 'Connected';
        connectionStatus.style.background = '#b8e0b8';
        if (!useSimulated) {
            streamStatus.innerText = 'CONNECTED';
            streamStatus.style.background = '#3c879a';
            brainStateParams.style.display = 'block';
        }
    };
    socket.onclose = () => {
        isConnected = false;
        connectionStatus.innerText = 'Disconnected';
        connectionStatus.style.background = '#c2dde6';
        if (!useSimulated) {
            streamStatus.innerText = 'DISCONNECTED';
            streamStatus.style.background = '#a3c1ca';
            brainStateParams.style.display = 'none';
            wsUrlBox.innerText = 'No device connected';
        }
        resetUI();

        if (reconnectAttempts < maxReconnect) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, 2000 * reconnectAttempts);
        }
    };
    socket.onmessage = (event) => {
        if (useSimulated) return;
        const data = JSON.parse(event.data);
        if (data.type === 'comPort') {
            if (data.port) {
                wsUrlBox.innerText = `Device on ${data.port}`;
            } else {
                wsUrlBox.innerText = 'No device connected';
            }
            return;
        }
        dataReceived = true;
        handleIncomingData(data);
    };
}

function handleIncomingData(data) {
    if (data.type === 'raw') {
        sampleInfo.innerText = `Samples: -- · latest: ${data.sample.toFixed(2)}`;
        let qual = (70 + Math.random() * 20).toFixed(1);
        signalQuality.innerText = qual;
        qualityText.innerText = qual + '%';
    } else if (data.type === 'eeg') {
        const b = data.bands;
        deltaVal.innerText = b.delta;
        thetaVal.innerText = b.theta;
        alphaVal.innerText = b.alpha;
        betaVal.innerText = b.beta;
        gammaVal.innerText = b.gamma;

        if (window.updateBandWaveforms) {
            window.updateBandWaveforms(
                parseFloat(b.delta),
                parseFloat(b.theta),
                parseFloat(b.alpha),
                parseFloat(b.beta),
                parseFloat(b.gamma)
            );
        }

        bandHistory.push({
            delta: parseFloat(b.delta),
            theta: parseFloat(b.theta),
            alpha: parseFloat(b.alpha),
            beta: parseFloat(b.beta),
            gamma: parseFloat(b.gamma)
        });

        const dominant = highlightDominantBand(b);
        updateBrainStateParams(b, dominant, data.state || 'Unknown');

        if (data.state) {
            setBrainColor(data.state);
            diagnosticText.innerHTML = `<strong>Detected: ${data.state}</strong> (real-time)`;
            detectedStateParam.innerText = data.state;
        }
    } else if (data.type === 'sessions') {
        recentSessions = data.sessions;
        updateRecentList();
    }
}

// Highlight dominant band
function highlightDominantBand(bands) {
    Object.values(bandItems).forEach(el => el.classList.remove('dominant'));
    const values = {
        delta: parseFloat(bands.delta),
        theta: parseFloat(bands.theta),
        alpha: parseFloat(bands.alpha),
        beta: parseFloat(bands.beta),
        gamma: parseFloat(bands.gamma)
    };
    let maxBand = 'delta';
    let maxVal = values.delta;
    for (let band in values) {
        if (values[band] > maxVal) {
            maxVal = values[band];
            maxBand = band;
        }
    }
    if (bandItems[maxBand]) bandItems[maxBand].classList.add('dominant');
    return maxBand.toUpperCase();
}

function updateBrainStateParams(bands, dominant, state) {
    const total = parseFloat(bands.delta) + parseFloat(bands.theta) + parseFloat(bands.alpha) + parseFloat(bands.beta) + parseFloat(bands.gamma);
    if (total === 0) return;
    deltaPercent.innerText = ((parseFloat(bands.delta) / total) * 100).toFixed(1) + '%';
    thetaPercent.innerText = ((parseFloat(bands.theta) / total) * 100).toFixed(1) + '%';
    alphaPercent.innerText = ((parseFloat(bands.alpha) / total) * 100).toFixed(1) + '%';
    betaPercent.innerText = ((parseFloat(bands.beta) / total) * 100).toFixed(1) + '%';
    gammaPercent.innerText = ((parseFloat(bands.gamma) / total) * 100).toFixed(1) + '%';
    dominantBandSpan.innerText = dominant;
    detectedStateParam.innerText = state;
}

function setBrainColor(state) {
    const colors = {
        'Anxiety': '#bc8f8f',
        'Fatigue': '#a3c1ca',
        'Distraction': '#d4b68a',
        'Stress': '#b56a6a',
        'Relaxed': '#8fc9a3',
        'Focused': '#7fb3d5',
        'Neutral': '#2f6e7a'
    };
    brainIcon.style.color = colors[state] || '#2f6e7a';
}

// Simulated data
function startSimulatedData() {
    brainStateParams.style.display = 'none';
    wsUrlBox.innerText = 'Simulated mode (no device)';
    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(() => {
        const delta = (1 + Math.random()*0.5).toFixed(2);
        const theta = (0.8 + Math.random()*0.4).toFixed(2);
        const alpha = (0.6 + Math.random()*0.6).toFixed(2);
        const beta  = (0.4 + Math.random()*0.5).toFixed(2);
        const gamma = (0.2 + Math.random()*0.3).toFixed(2);
        deltaVal.innerText = delta;
        thetaVal.innerText = theta;
        alphaVal.innerText = alpha;
        betaVal.innerText = beta;
        gammaVal.innerText = gamma;

        if (window.updateBandWaveforms) {
            window.updateBandWaveforms(parseFloat(delta), parseFloat(theta), parseFloat(alpha), parseFloat(beta), parseFloat(gamma));
        }

        bandHistory.push({
            delta: parseFloat(delta),
            theta: parseFloat(theta),
            alpha: parseFloat(alpha),
            beta: parseFloat(beta),
            gamma: parseFloat(gamma)
        });

        const bands = { delta, theta, alpha, beta, gamma };
        const dominant = highlightDominantBand(bands);
        updateBrainStateParams(bands, dominant, 'Unknown');

        const qual = (70 + Math.random()*20).toFixed(1);
        signalQuality.innerText = qual;
        qualityText.innerText = qual + '%';

        const fakeSample = parseFloat(alpha)*0.8 + Math.random()*1.5;
        sampleInfo.innerText = `Samples: sim · latest: ${fakeSample.toFixed(2)}`;

        const states = ['Anxiety','Fatigue','Distraction','Stress','Relaxed','Focused','Neutral'];
        const randState = states[Math.floor(Math.random()*states.length)];
        setBrainColor(randState);
        diagnosticText.innerHTML = `<strong>Simulated: ${randState}</strong> (demo)`;
    }, 300);
}

function stopSimulatedData() {
    if (simInterval) clearInterval(simInterval);
    wsUrlBox.innerText = 'Simulated mode stopped';
}

// Timer functions
function startTimer() {
    secondsElapsed = 0;
    timerDisplay.innerText = formatTime(0);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        timerDisplay.innerText = formatTime(secondsElapsed);
        if (secondsElapsed >= 30) {
            mainAction.innerText = 'Stop & Analyze';
            mainAction.classList.add('ready');
        } else {
            mainAction.innerText = 'Stop';
            mainAction.classList.remove('ready');
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Analysis from EEG (with loading)
function performAnalysis() {
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.querySelector('.loading-text').innerText = 'Analyzing your EEG data...';

    setTimeout(() => {
        document.getElementById('loadingOverlay').style.display = 'none';

        if (bandHistory.length === 0) {
            console.warn('No band history, using random');
            const randomConditions = ['Stress','Anxiety','Fatigue','Mild Depression','Distraction','Focused','Relaxed'];
            const picked = randomConditions[Math.floor(Math.random() * randomConditions.length)];
            showResult(picked);
            return;
        }

        const avg = bandHistory.reduce((acc, cur) => {
            acc.delta += cur.delta;
            acc.theta += cur.theta;
            acc.alpha += cur.alpha;
            acc.beta += cur.beta;
            acc.gamma += cur.gamma;
            return acc;
        }, { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 });

        const count = bandHistory.length;
        avg.delta /= count;
        avg.theta /= count;
        avg.alpha /= count;
        avg.beta /= count;
        avg.gamma /= count;

        let condition = 'Neutral';

        if (avg.beta > 1.2 && avg.alpha < 0.8) {
            condition = 'Stress';
        } else if (avg.beta > 1.5 && avg.alpha < 0.6) {
            condition = 'Anxiety';
        } else if (avg.delta > 1.8 && avg.theta > 1.5) {
            condition = 'Fatigue';
        } else if (avg.alpha < 0.7 && avg.beta < 0.8) {
            condition = 'Distraction';
        } else if (avg.alpha > 1.5 && avg.beta < 0.9) {
            condition = 'Relaxed';
        } else if (avg.beta > 0.9 && avg.gamma > 0.6) {
            condition = 'Focused';
        } else if (avg.alpha < 0.8 && avg.beta < 0.7 && avg.gamma < 0.5) {
            condition = 'Mild Depression';
        }

        if (condition === 'Neutral') {
            const maxBand = Object.keys(avg).reduce((a, b) => avg[a] > avg[b] ? a : b);
            const map = {
                delta: 'Fatigue',
                theta: 'Daydreaming',
                alpha: 'Relaxed',
                beta: 'Focused',
                gamma: 'Focused'
            };
            condition = map[maxBand] || 'Neutral';
        }

        showResult(condition);
    }, 1000);
}

function showResult(condition) {
    overlayCondition.innerText = condition;
    solutionsContent.innerHTML = getSolutions(condition);
    overlay.style.display = 'block';

    diagnosticText.innerHTML = `<strong style="color:#1a5768;">Detected: ${condition}</strong> · based on 30s EEG analysis.`;

    diagnosticSolutionsBtn.style.display = 'inline-block';
    diagnosticSolutionsBtn.onclick = () => {
        window.location.href = `solutions.html?condition=${condition.toLowerCase()}`;
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'saveSession',
            condition: condition,
            bands: {
                delta: deltaVal.innerText,
                theta: thetaVal.innerText,
                alpha: alphaVal.innerText,
                beta: betaVal.innerText,
                gamma: gammaVal.innerText
            },
            duration: secondsElapsed
        }));
    }

    const timestamp = new Date().toLocaleTimeString();
    recentSessions.unshift({ 
        time: timestamp, 
        condition: condition, 
        bands: {
            delta: deltaVal.innerText,
            theta: thetaVal.innerText,
            alpha: alphaVal.innerText,
            beta: betaVal.innerText,
            gamma: gammaVal.innerText
        }
    });
    updateRecentList();
}

function getSolutions(condition) {
    const solutionsMap = {
        'Stress': 'Try deep breathing: inhale 4s, hold 4s, exhale 6s. Consider a short walk or mindfulness meditation.',
        'Anxiety': 'Ground yourself: 5-4-3-2-1 technique (see 5 things, touch 4, hear 3, smell 2, taste 1).',
        'Fatigue': 'Take a power nap (10-20 min) or drink water. Avoid screens for a few minutes.',
        'Distraction': 'Use the Pomodoro technique: 25 min focus, 5 min break. Remove phone from sight.',
        'Mild Depression': 'Reach out to a friend, do one small pleasurable activity, or consult a professional.',
        'Focused': 'Great! Keep up the good work. Take short breaks to maintain it.',
        'Relaxed': 'Enjoy this state. You might want to try meditation to cultivate it further.',
        'Neutral': 'Your brain state appears balanced. Continue with your current activities.',
        'Daydreaming': 'Try a light focus exercise or take a short walk.'
    };
    return solutionsMap[condition] || 'No specific suggestions. Stay mindful.';
}

function updateRecentList() {
    recentList.innerHTML = '';
    if (recentSessions.length === 0) {
        recentList.innerHTML = '<li>No previous sessions yet.</li>';
    } else {
        recentSessions.slice(0,5).forEach(s => {
            const li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.innerHTML = `${s.condition} <span style="color:#5f8e9c;">${s.time}</span>`;
            li.addEventListener('click', () => {
                window.location.href = `solutions.html?condition=${s.condition.toLowerCase()}`;
            });
            recentList.appendChild(li);
        });
    }
}

// Error toasts
function showError(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `error-toast ${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast success';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ---------- Event listeners ----------
liveBtn.addEventListener('click', () => {
    if (monitoring) return;
    liveBtn.classList.add('active');
    simBtn.classList.remove('active');
    useSimulated = false;
    streamStatus.innerText = isConnected ? 'CONNECTED' : 'DISCONNECTED';
    streamStatus.style.background = isConnected ? '#3c879a' : '#a3c1ca';
    if (isConnected) brainStateParams.style.display = 'block';
    else brainStateParams.style.display = 'none';
});

simBtn.addEventListener('click', () => {
    if (monitoring) return;
    simBtn.classList.add('active');
    liveBtn.classList.remove('active');
    useSimulated = true;
    streamStatus.innerText = 'SIMULATED';
    streamStatus.style.background = '#8a9aa0';
    brainStateParams.style.display = 'none';
    wsUrlBox.innerText = 'Simulated mode';
});

mainAction.addEventListener('click', (e) => {
    e.stopPropagation();

    if (!monitoring) {
        if (!useSimulated && !isConnected) {
            showError('❌ No device connected. Please connect to live device or switch to simulated feed.', 'error');
            return;
        }
        monitoring = true;
        dataReceived = false;
        bandHistory = [];
        liveBtn.disabled = true;
        simBtn.disabled = true;
        startTimer();
        mainAction.innerText = 'Stop';
        mainAction.classList.add('stop');
        if (useSimulated) startSimulatedData();

        canvas.style.border = '3px solid #6b8e4c';
        canvas.style.boxShadow = '0 0 15px #6b8e4c';
    } else {
        monitoring = false;
        stopTimer();
        stopSimulatedData();
        liveBtn.disabled = false;
        simBtn.disabled = false;
        mainAction.innerText = 'Start Monitoring';
        mainAction.classList.remove('stop', 'ready');

        canvas.style.border = 'none';
        canvas.style.boxShadow = 'none';

        if (!useSimulated) {
            streamStatus.innerText = isConnected ? 'CONNECTED' : 'DISCONNECTED';
            if (!dataReceived) {
                showError('⚠️ No data received from device. Check your Arduino connection.', 'error');
                diagnosticText.innerText = 'No data received during session. Please check your hardware.';
                diagnosticSolutionsBtn.style.display = 'none';
                return;
            }
        } else {
            streamStatus.innerText = 'SIMULATED (idle)';
        }

        if (secondsElapsed >= 30) {
            performAnalysis();
        } else {
            diagnosticText.innerText = 'Session too short (minimum 30s). No diagnosis.';
            diagnosticSolutionsBtn.style.display = 'none';
        }
    }
});

// Overlay button
document.getElementById('viewSolutionsOverlayBtn').addEventListener('click', () => {
    const condition = overlayCondition.innerText.toLowerCase();
    window.location.href = `solutions.html?condition=${condition}`;
});

// Prevent overlay from closing when clicking inside it
overlay.addEventListener('click', (e) => e.stopPropagation());

// Start WebSocket
connectWebSocket();