// app.js – with adaptive model, loading animation, and polished errors
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

// Google Sheets script URL – replace with your own!
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

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

// Onboarding elements
const onboardingModal = document.getElementById('onboardingModal');
const loadingOverlay = document.getElementById('loadingOverlay');

// Brain state parameters
const brainStateParams = document.getElementById('brainStateParams');
const deltaPercent = document.getElementById('deltaPercent');
const thetaPercent = document.getElementById('thetaPercent');
const alphaPercent = document.getElementById('alphaPercent');
const betaPercent = document.getElementById('betaPercent');
const gammaPercent = document.getElementById('gammaPercent');
const dominantBandSpan = document.getElementById('dominantBand').querySelector('strong');
const detectedStateParam = document.getElementById('detectedStateParam').querySelector('strong');

// Band items
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

let recentSessions = [];

// ---------- WebSocket (unchanged) ----------
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
        dataReceived = true;
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

        bandHistory.push({
            delta: parseFloat(b.delta),
            theta: parseFloat(b.theta),
            alpha: parseFloat(b.alpha),
            beta: parseFloat(b.beta),
            gamma: parseFloat(b.gamma)
        });

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

// Helper functions (unchanged) – include them all
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

// Simulated data (unchanged)
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

        bandHistory.push({
            delta: parseFloat(delta),
            theta: parseFloat(theta),
            alpha: parseFloat(alpha),
            beta: parseFloat(beta),
            gamma: parseFloat(gamma)
        });

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

// ---------- Onboarding with validation and adaptive model ----------
let currentStep = 1;
const totalSteps = 5;

function showStep(step) {
    for (let i = 1; i <= totalSteps; i++) {
        const content = document.getElementById(`step${i}Content`);
        const stepEl = document.getElementById(`step${i}`);
        if (content) content.classList.remove('active');
        if (stepEl) {
            stepEl.classList.remove('active', 'completed');
            if (i < step) stepEl.classList.add('completed');
        }
    }
    const currentContent = document.getElementById(`step${step}Content`);
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentContent) currentContent.classList.add('active');
    if (currentStepEl) currentStepEl.classList.add('active');
    currentStep = step;
}

function validateStep1() {
    const age = document.getElementById('userAge').value;
    const gender = document.getElementById('userGender').value;
    if (!age || age < 1 || age > 120) {
        showError('Please enter a valid age (1–120).', 'warning');
        return false;
    }
    if (!gender) {
        showError('Please select your gender.', 'warning');
        return false;
    }
    return true;
}

function validateStep2() {
    const occupation = document.getElementById('occupationMain').value;
    const relationship = document.getElementById('relationship').value;
    if (!occupation) {
        showError('Please select your occupation.', 'warning');
        return false;
    }
    if (!relationship) {
        showError('Please select your relationship status.', 'warning');
        return false;
    }
    return true;
}

window.validateAndNext = function(step) {
    if (step === 1 && validateStep1()) nextStep(1);
    else if (step === 2 && validateStep2()) nextStep(2);
    else if (step === 3) nextStep(3);
    else if (step === 4) nextStep(4);
};

window.nextStep = function(step) {
    if (step < totalSteps) showStep(step + 1);
};

window.prevStep = function(step) {
    if (step > 1) showStep(step - 1);
};

// Occupation sub‑options
window.toggleOccupationSub = function() {
    const main = document.getElementById('occupationMain').value;
    const subGroup = document.getElementById('occupationSubGroup');
    const subSelect = document.getElementById('occupationSub');
    const subLabel = document.getElementById('occupationSubLabel');

    let options = [];
    let labelText = 'Specify';

    if (main === 'govt') {
        options = ['Central Government', 'State Government', 'Public Sector Undertaking'];
        labelText = 'Type of government job';
    } else if (main === 'private') {
        options = ['IT/Tech', 'Manufacturing', 'Finance', 'Healthcare', 'Education', 'Retail', 'Other'];
        labelText = 'Industry';
    } else if (main === 'self') {
        options = ['Business Owner', 'Freelancer', 'Consultant', 'Other'];
        labelText = 'Type';
    } else if (main === 'student') {
        options = ['School', 'College/University', 'Postgraduate', 'Vocational'];
        labelText = 'Education level';
    } else if (main === 'unemployed' || main === 'retired' || main === 'homemaker') {
        options = ['Not applicable'];
        labelText = '';
    } else {
        options = ['Other'];
        labelText = 'Please specify';
    }

    if (options.length === 0 || (options.length === 1 && options[0] === 'Not applicable')) {
        subGroup.style.display = 'none';
    } else {
        subGroup.style.display = 'block';
        subLabel.innerText = labelText;
        subSelect.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    }
};

// Collect all user data
function collectUserData() {
    return {
        name: document.getElementById('userName').value,
        age: document.getElementById('userAge').value,
        gender: document.getElementById('userGender').value,
        occupation_main: document.getElementById('occupationMain').value,
        occupation_sub: document.getElementById('occupationSubGroup').style.display !== 'none' ? document.getElementById('occupationSub').value : '',
        relationship: document.getElementById('relationship').value,
        smoking: document.getElementById('habitSmoking').value,
        alcohol: document.getElementById('habitAlcohol').value,
        gaming: document.getElementById('habitGaming').value,
        other_habits: document.getElementById('habitOther').value,
        stress: document.getElementById('qStress').value,
        anxiety: document.getElementById('qAnxiety').value,
        depression: document.getElementById('qDepression').value,
        sleep_issue: document.getElementById('qSleep').value,
        focus: document.getElementById('qFocus').value,
        timestamp: new Date().toISOString()
    };
}

// Send to Google Sheets (no‑cors)
async function sendToGoogleSheets(data) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log('Data sent to Google Sheets');
    } catch (error) {
        console.error('Failed to send to Google Sheets:', error);
    }
}

// ---------- Adaptive model (simulated) ----------
// We store previous user data in localStorage and average symptom scores per condition.
// This is a simple demonstration – in a real system you'd have a backend.
function getAdaptiveCondition(userData) {
    // Convert symptom answers to numeric scores
    const scores = {
        stress: parseInt(userData.stress),
        anxiety: parseInt(userData.anxiety),
        depression: parseInt(userData.depression),
        sleep: parseInt(userData.sleep_issue),
        focus: parseInt(userData.focus)
    };

    // Load existing knowledge base from localStorage
    let knowledge = JSON.parse(localStorage.getItem('mindflow_knowledge')) || {
        Stress: { count: 0, total: 0 },
        Anxiety: { count: 0, total: 0 },
        Fatigue: { count: 0, total: 0 },
        Distraction: { count: 0, total: 0 },
        'Mild Depression': { count: 0, total: 0 },
        Relaxed: { count: 0, total: 0 },
        Focused: { count: 0, total: 0 }
    };

    // First, compute a simple rule-based condition as baseline
    let baselineCondition = 'Neutral';
    if (scores.anxiety >= 4) baselineCondition = 'Anxiety';
    else if (scores.stress >= 4) baselineCondition = 'Stress';
    else if (scores.depression >= 4) baselineCondition = 'Mild Depression';
    else if (scores.sleep >= 4) baselineCondition = 'Fatigue';
    else if (scores.focus >= 4) baselineCondition = 'Distraction';
    else if (scores.stress <= 2 && scores.anxiety <= 2 && scores.depression <= 2) baselineCondition = 'Relaxed';
    else if (scores.focus <= 2 && scores.stress <= 2) baselineCondition = 'Focused';

    // Update knowledge base with this new user (we'll use the baseline as ground truth for now)
    if (knowledge[baselineCondition]) {
        knowledge[baselineCondition].count += 1;
        // Average of symptom scores for this condition
        knowledge[baselineCondition].total = (knowledge[baselineCondition].total || 0) + (scores.stress + scores.anxiety + scores.depression + scores.sleep + scores.focus) / 5;
    }

    // Save updated knowledge
    localStorage.setItem('mindflow_knowledge', JSON.stringify(knowledge));

    // Now, to determine the final condition, we can use a weighted combination:
    // For each possible condition, compute how close the user's scores are to the historical average of that condition.
    // This simulates a model that becomes more accurate with more data.
    let bestCondition = baselineCondition;
    let bestScore = Infinity;

    for (let [cond, data] of Object.entries(knowledge)) {
        if (data.count === 0) continue;
        const avgSymptomScore = data.total / data.count;
        const userAvg = (scores.stress + scores.anxiety + scores.depression + scores.sleep + scores.focus) / 5;
        const diff = Math.abs(userAvg - avgSymptomScore);
        if (diff < bestScore) {
            bestScore = diff;
            bestCondition = cond;
        }
    }

    return bestCondition;
}

// ---------- Form submission handlers ----------
window.submitAndUseDevice = async function() {
    const userData = collectUserData();
    await sendToGoogleSheets(userData);
    onboardingModal.style.display = 'none';
    showToast('Data saved. You can now start EEG monitoring.');
};

window.submitAndAnalyzeOnly = async function() {
    const userData = collectUserData();
    await sendToGoogleSheets(userData);

    // Show loading overlay
    loadingOverlay.style.display = 'flex';
    onboardingModal.style.display = 'none';

    // Simulate analysis delay (2 seconds)
    setTimeout(() => {
        const condition = getAdaptiveCondition(userData);
        loadingOverlay.style.display = 'none';
        showResult(condition);
    }, 2000);
};

// ---------- Analysis from EEG (unchanged) ----------
function performAnalysis() {
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

// ---------- Enhanced error toasts ----------
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

// Add CSS for error variants (append to style or include in <style>)
const style = document.createElement('style');
style.innerHTML = `
    .error-toast.warning {
        background: #f0ad4e;
        color: white;
    }
    .error-toast.success {
        background: #8fc9a3;
        color: white;
    }
    .error-toast.error {
        background: #d9534f;
        color: white;
    }
`;
document.head.appendChild(style);

// ---------- Event listeners (EEG controls) ----------
liveBtn.addEventListener('click', () => {
    if (monitoring) return;
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
    if (monitoring) return;
    simBtn.classList.add('active');
    liveBtn.classList.remove('active');
    useSimulated = true;
    streamStatus.innerText = 'SIMULATED';
    streamStatus.style.background = '#8a9aa0';
    wsUrlBox.style.display = 'none';
    brainStateParams.style.display = 'none';
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
    } else {
        monitoring = false;
        stopTimer();
        stopSimulatedData();
        liveBtn.disabled = false;
        simBtn.disabled = false;
        mainAction.innerText = 'Start Monitoring';
        mainAction.classList.remove('stop', 'ready');

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

// Click outside to close overlay
document.addEventListener('click', (e) => {
    if (overlay.style.display === 'block' && !overlay.contains(e.target) && e.target !== diagnosticSolutionsBtn && e.target !== document.getElementById('viewSolutionsOverlayBtn')) {
        overlay.style.display = 'none';
    }
});

overlay.addEventListener('click', (e) => e.stopPropagation());

// Initialize WebSocket
connectWebSocket();

// Show onboarding modal on page load (already visible)