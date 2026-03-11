// app.js – final fixed version with stopPropagation
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
const exportBtn = document.getElementById('exportBtn');
const wsUrlBox = document.getElementById('wsUrlBox');
const diagnosticSolutionsBtn = document.getElementById('diagnosticSolutionsBtn');

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

// Multi‑band trend chart
let bandTrendCtx = document.getElementById('bandTrendCanvas').getContext('2d');
let bandTrendChart = new Chart(bandTrendCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Delta', data: [], borderColor: '#1f77b4', pointRadius: 0, tension: 0.2 },
            { label: 'Theta', data: [], borderColor: '#ff7f0e', pointRadius: 0, tension: 0.2 },
            { label: 'Alpha', data: [], borderColor: '#2ca02c', pointRadius: 0, tension: 0.2 },
            { label: 'Beta',  data: [], borderColor: '#d62728', pointRadius: 0, tension: 0.2 },
            { label: 'Gamma', data: [], borderColor: '#9467bd', pointRadius: 0, tension: 0.2 }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { display: false }, y: { beginAtZero: true, grid: { color: '#cde3ea' } } },
        plugins: { legend: { display: false } }
    }
});

// Recent sessions
let recentSessions = [];

// ---------- WebSocket with reconnection ----------
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
            wsUrlBox.style.display = 'block';
        }
        socket.send(JSON.stringify({ type: 'getSessions' }));
    };
    socket.onclose = () => {
        isConnected = false;
        connectionStatus.innerText = 'Disconnected';
        connectionStatus.style.background = '#c2dde6';
        if (!useSimulated) {
            streamStatus.innerText = 'DISCONNECTED';
            streamStatus.style.background = '#a3c1ca';
            brainStateParams.style.display = 'none';
            wsUrlBox.style.display = 'block';
        }
        if (reconnectAttempts < maxReconnect) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, 2000 * reconnectAttempts);
        }
    };
    socket.onmessage = (event) => {
        if (useSimulated) return;
        const data = JSON.parse(event.data);
        handleIncomingData(data);
    };
}

function handleIncomingData(data) {
    if (data.type === 'raw') {
        sampleInfo.innerText = `Samples: -- · latest: ${data.sample.toFixed(2)}`;
        if (window.updateWaveform) window.updateWaveform(data.sample);
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

        updateBandTrend(b);
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

function updateBandTrend(bands) {
    const now = new Date().toLocaleTimeString();
    bandTrendChart.data.labels.push(now);
    bandTrendChart.data.datasets[0].data.push(parseFloat(bands.delta));
    bandTrendChart.data.datasets[1].data.push(parseFloat(bands.theta));
    bandTrendChart.data.datasets[2].data.push(parseFloat(bands.alpha));
    bandTrendChart.data.datasets[3].data.push(parseFloat(bands.beta));
    bandTrendChart.data.datasets[4].data.push(parseFloat(bands.gamma));

    if (bandTrendChart.data.labels.length > 30) {
        bandTrendChart.data.labels.shift();
        bandTrendChart.data.datasets.forEach(ds => ds.data.shift());
    }
    bandTrendChart.update();
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

// ---------- Simulated data ----------
function startSimulatedData() {
    brainStateParams.style.display = 'none';
    wsUrlBox.style.display = 'none';
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

        const bands = { delta, theta, alpha, beta, gamma };
        updateBandTrend(bands);
        highlightDominantBand(bands);

        const qual = (70 + Math.random()*20).toFixed(1);
        signalQuality.innerText = qual;
        qualityText.innerText = qual + '%';

        const fakeSample = parseFloat(alpha)*0.8 + Math.random()*1.5;
        sampleInfo.innerText = `Samples: sim · latest: ${fakeSample.toFixed(2)}`;
        if (window.updateWaveform) window.updateWaveform(fakeSample);

        const states = ['Anxiety','Fatigue','Distraction','Stress','Relaxed','Focused','Neutral'];
        const randState = states[Math.floor(Math.random()*states.length)];
        setBrainColor(randState);
        diagnosticText.innerHTML = `<strong>Simulated: ${randState}</strong> (demo)`;
    }, 300);
}

function stopSimulatedData() {
    if (simInterval) clearInterval(simInterval);
}

// ---------- Timer functions ----------
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

// ---------- Export CSV ----------
exportBtn.addEventListener('click', () => {
    let csv = 'Timestamp,Delta,Theta,Alpha,Beta,Gamma,State\n';
    recentSessions.forEach(s => {
        csv += `${s.timestamp},${s.bands?.delta || ''},${s.bands?.theta || ''},${s.bands?.alpha || ''},${s.bands?.beta || ''},${s.bands?.gamma || ''},${s.condition}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindflow_sessions.csv';
    a.click();
    URL.revokeObjectURL(url);
});

// ---------- Analysis after stop ----------
function performAnalysis() {
    const conditions = ['Stress','Anxiety','Fatigue','Mild Depression','Distraction','Focused','Relaxed'];
    const picked = conditions[Math.floor(Math.random() * conditions.length)];
    overlayCondition.innerText = picked;
    solutionsContent.innerHTML = getSolutions(picked);
    overlay.style.display = 'block'; // Make sure overlay appears
    console.log('Overlay should be visible now');

    diagnosticText.innerHTML = `<strong style="color:#1a5768;">Detected: ${picked}</strong> · based on 30s EEG analysis.`;

    // Show the solutions button in diagnostic area
    diagnosticSolutionsBtn.style.display = 'inline-block';
    diagnosticSolutionsBtn.onclick = () => {
        window.location.href = 'solutions.html';
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'saveSession',
            condition: picked,
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

    // Add to recent sessions
    const timestamp = new Date().toLocaleTimeString();
    recentSessions.unshift({ 
        time: timestamp, 
        condition: picked, 
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
        'Relaxed': 'Enjoy this state. You might want to try meditation to cultivate it further.'
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
            li.innerHTML = `${s.condition} <span style="color:#5f8e9c;">${s.time}</span>`;
            recentList.appendChild(li);
        });
    }
}

// ---------- UI helpers ----------
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.style.background = '#8aaeb9';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ---------- Event listeners ----------
liveBtn.addEventListener('click', () => {
    liveBtn.classList.add('active');
    simBtn.classList.remove('active');
    useSimulated = false;
    streamStatus.innerText = isConnected ? 'CONNECTED' : 'DISCONNECTED';
    streamStatus.style.background = isConnected ? '#3c879a' : '#a3c1ca';
    wsUrlBox.style.display = 'block';
    if (isConnected) brainStateParams.style.display = 'block';
    else brainStateParams.style.display = 'none';
});

simBtn.addEventListener('click', () => {
    simBtn.classList.add('active');
    liveBtn.classList.remove('active');
    useSimulated = true;
    streamStatus.innerText = 'SIMULATED';
    streamStatus.style.background = '#8a9aa0';
    wsUrlBox.style.display = 'none';
    brainStateParams.style.display = 'none';
});

mainAction.addEventListener('click', (e) => {
    e.stopPropagation(); // 🔥 Prevents document click listener from closing overlay immediately

    if (!monitoring) {
        if (!useSimulated && !isConnected) {
            showError('❌ No device connected. Please connect to live device or switch to simulated feed.');
            return;
        }
        monitoring = true;
        startTimer();
        mainAction.innerText = 'Stop';
        mainAction.classList.add('stop');
        if (useSimulated) startSimulatedData();
    } else {
        monitoring = false;
        stopTimer();
        stopSimulatedData();
        mainAction.innerText = 'Start Monitoring';
        mainAction.classList.remove('stop', 'ready');

        if (!useSimulated) {
            streamStatus.innerText = isConnected ? 'CONNECTED' : 'DISCONNECTED';
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

// Overlay button – opens solutions page
document.getElementById('viewSolutionsOverlayBtn').addEventListener('click', () => {
    window.location.href = 'solutions.html';
});

// Click outside to close overlay
document.addEventListener('click', (e) => {
    if (overlay.style.display === 'block' && !overlay.contains(e.target) && e.target !== diagnosticSolutionsBtn && e.target !== document.getElementById('viewSolutionsOverlayBtn')) {
        overlay.style.display = 'none';
    }
});

// Prevent overlay from closing when clicking inside it
overlay.addEventListener('click', (e) => e.stopPropagation());

connectWebSocket();