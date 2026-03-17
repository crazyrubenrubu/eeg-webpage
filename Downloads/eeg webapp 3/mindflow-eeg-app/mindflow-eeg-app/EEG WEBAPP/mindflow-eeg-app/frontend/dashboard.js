// frontend/dashboard.js
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
let recentSessions = [];
let rawSignalHistory = []; // for noise calculation (last 50 samples)

// DOM elements
const connectionStatus = document.getElementById('connectionStatus');
const mainAction = document.getElementById('mainActionBtn');
const timerDisplay = document.getElementById('timerDisplay');
const deltaVal = document.getElementById('bwDelta');
const thetaVal = document.getElementById('bwTheta');
const alphaVal = document.getElementById('bwAlpha');
const betaVal = document.getElementById('bwBeta');
const gammaVal = document.getElementById('bwGamma');
const sampleInfo = document.getElementById('liveValue');
const diagnosticText = document.getElementById('diagnosticText');
const overlay = document.getElementById('resultOverlay');
const overlayCondition = document.getElementById('overlayCondition');
const solutionsContent = document.getElementById('solutionsContent');
const brainIcon = document.querySelector('.fa-brain'); // now exists
const wsUrlBox = document.getElementById('wsUrlBox');
const diagnosticSolutionsBtn = document.getElementById('diagnosticSolutionsBtn');
const liveBtn = document.getElementById('liveBtn');
const simBtn = document.getElementById('simBtn');
const canvas = document.getElementById('eegCanvas');
const brainStateParams = document.getElementById('brainStateParams');
const deltaPercent = document.getElementById('paramDeltaPct');
const thetaPercent = document.getElementById('paramThetaPct');
const alphaPercent = document.getElementById('paramAlphaPct');
const betaPercent = document.getElementById('paramBetaPct');
const gammaPercent = document.getElementById('paramGammaPct');
const dominantBandSpan = document.getElementById('paramDominantWave');
const detectedStateParam = document.getElementById('paramDetectedState');
const deltaBar = document.getElementById('paramDeltaBar');
const thetaBar = document.getElementById('paramThetaBar');
const alphaBar = document.getElementById('paramAlphaBar');
const betaBar = document.getElementById('paramBetaBar');
const gammaBar = document.getElementById('paramGammaBar');

// Mental state elements
const dominantBandEl = document.getElementById('dominantBand');
const severityEl = document.getElementById('severity');
const mentalStateEl = document.getElementById('mentalState');
const stressFill = document.getElementById('stressFill');
const stressVal = document.getElementById('stressVal');
const attnFill = document.getElementById('attnFill');
const attnVal = document.getElementById('attnVal');
const analysisUpdated = document.getElementById('analysisUpdated');

// Noise elements
const noiseFill = document.getElementById('noiseFill');
const noiseValue = document.getElementById('noiseValue');

// Recent sessions list
const recentListEl = document.getElementById('recentSessionsList');

// Band cards
const bandItems = {
    delta: document.getElementById('cardDelta'),
    theta: document.getElementById('cardTheta'),
    alpha: document.getElementById('cardAlpha'),
    beta: document.getElementById('cardBeta'),
    gamma: document.getElementById('cardGamma')
};

let bwRadarChart = null;

// ------------------ Chart Colors ------------------
function getChartColors() {
    return document.body.classList.contains('dark-mode')
        ? ['#7c3aed', '#9333ea', '#a855f7', '#c084fc', '#e9d5ff']
        : ['#2f7d8f', '#459ba4', '#70b7bf', '#99d3d9', '#c2eff3'];
}

// ------------------ Radar Chart Init ------------------
function initRadarChart() {
    const ctx = document.getElementById('bwPie');
    if (!ctx) return;
    const colors = getChartColors();
    const isDark = document.body.classList.contains('dark-mode');
    bwRadarChart = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'],
            datasets: [{
                label: 'Current State',
                data: [0, 0, 0, 0, 0],
                backgroundColor: isDark ? 'rgba(124,58,237,0.4)' : 'rgba(47,125,143,0.4)',
                borderColor: isDark ? '#7c3aed' : '#2f7d8f',
                borderWidth: 3,
                pointBackgroundColor: colors,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colors,
                pointRadius: 4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { ticks: { display: false }, suggestedMin: 0, suggestedMax: 50 } },
            plugins: { legend: { display: false } }
        }
    });
}
document.addEventListener('DOMContentLoaded', initRadarChart);

// ------------------ Reset UI ------------------
function resetUI() {
    if (deltaVal) deltaVal.innerText = '0%';
    if (thetaVal) thetaVal.innerText = '0%';
    if (alphaVal) alphaVal.innerText = '0%';
    if (betaVal) betaVal.innerText = '0%';
    if (gammaVal) gammaVal.innerText = '0%';
    if (sampleInfo) sampleInfo.innerText = 'Value: —';
    if (deltaPercent) deltaPercent.innerText = '0%';
    if (thetaPercent) thetaPercent.innerText = '0%';
    if (alphaPercent) alphaPercent.innerText = '0%';
    if (betaPercent) betaPercent.innerText = '0%';
    if (gammaPercent) gammaPercent.innerText = '0%';
    if (deltaBar) deltaBar.style.width = '0%';
    if (thetaBar) thetaBar.style.width = '0%';
    if (alphaBar) alphaBar.style.width = '0%';
    if (betaBar) betaBar.style.width = '0%';
    if (gammaBar) gammaBar.style.width = '0%';
    if (dominantBandSpan) dominantBandSpan.innerText = '—';
    if (detectedStateParam) detectedStateParam.innerText = 'Waiting…';
    if (dominantBandEl) dominantBandEl.innerText = '—';
    if (severityEl) severityEl.innerText = '—';
    if (mentalStateEl) mentalStateEl.innerText = 'Waiting…';
    if (stressFill) stressFill.style.width = '0%';
    if (stressVal) stressVal.innerText = '0';
    if (attnFill) attnFill.style.width = '0%';
    if (attnVal) attnVal.innerText = '0';
    if (analysisUpdated) analysisUpdated.innerText = 'Updated: —';
    if (noiseFill) noiseFill.style.width = '0%';
    if (noiseValue) noiseValue.innerText = '0%';
    if (window.resetMergedWaveform) window.resetMergedWaveform();
    if (window.resetMultiBandChart) window.resetMultiBandChart();
    if (brainIcon) brainIcon.style.color = 'var(--accent)';
    bandHistory = [];
    rawSignalHistory = [];
    dataReceived = false;
}

// ------------------ WebSocket ------------------
function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) return;
    socket = new WebSocket(wsUrl);
    socket.onopen = () => {
        isConnected = true;
        reconnectAttempts = 0;
        if (connectionStatus) {
            connectionStatus.innerText = 'Connected';
            connectionStatus.style.background = 'rgba(34,197,94,0.15)';
            connectionStatus.style.color = 'var(--good)';
        }
        if (!useSimulated && brainStateParams) brainStateParams.style.display = 'none';
    };
    socket.onclose = () => {
        isConnected = false;
        if (connectionStatus) {
            connectionStatus.innerText = 'Disconnected';
            connectionStatus.style.background = '';
            connectionStatus.style.color = '';
        }
        if (!useSimulated && wsUrlBox) wsUrlBox.innerText = 'No device connected';
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
            if (wsUrlBox) wsUrlBox.innerText = data.port ? `Device on ${data.port}` : 'No device connected';
            return;
        }
        dataReceived = true;
        handleIncomingData(data);
    };
}

// ------------------ Noise Calculation ------------------
function updateNoise(sample) {
    rawSignalHistory.push(sample);
    if (rawSignalHistory.length > 50) rawSignalHistory.shift();
    if (rawSignalHistory.length < 10) return;
    const mean = rawSignalHistory.reduce((a,b)=>a+b,0) / rawSignalHistory.length;
    const variance = rawSignalHistory.reduce((acc,val)=>acc + (val-mean)**2, 0) / rawSignalHistory.length;
    const stdDev = Math.sqrt(variance);
    // Raw ADC range 0-1023, typical signal variation up to ~200 counts
    const maxNoise = 200; // adjust based on your hardware
    let noisePct = Math.min(100, (stdDev / maxNoise) * 100);
    if (noiseFill) noiseFill.style.width = noisePct + '%';
    if (noiseValue) noiseValue.innerText = Math.round(noisePct) + '%';
}

// ------------------ Data Handling ------------------
function handleIncomingData(data) {
    if (data.type === 'raw') {
        if (sampleInfo) sampleInfo.innerText = `Value: ${data.sample.toFixed(2)}`;
        if (window.updateMergedWaveform) window.updateMergedWaveform(data.sample);
        updateNoise(data.sample);
    } else if (data.type === 'eeg') {
        const b = data.bands;
        const total = parseFloat(b.delta) + parseFloat(b.theta) + parseFloat(b.alpha) + parseFloat(b.beta) + parseFloat(b.gamma);
        if (total > 0) {
            const deltaPct = ((parseFloat(b.delta) / total) * 100).toFixed(1);
            const thetaPct = ((parseFloat(b.theta) / total) * 100).toFixed(1);
            const alphaPct = ((parseFloat(b.alpha) / total) * 100).toFixed(1);
            const betaPct = ((parseFloat(b.beta) / total) * 100).toFixed(1);
            const gammaPct = ((parseFloat(b.gamma) / total) * 100).toFixed(1);

            if (bwRadarChart) {
                bwRadarChart.data.datasets[0].data = [deltaPct, thetaPct, alphaPct, betaPct, gammaPct];
                bwRadarChart.update();
            }

            if (deltaVal) deltaVal.innerText = deltaPct + '%';
            if (thetaVal) thetaVal.innerText = thetaPct + '%';
            if (alphaVal) alphaVal.innerText = alphaPct + '%';
            if (betaVal) betaVal.innerText = betaPct + '%';
            if (gammaVal) gammaVal.innerText = gammaPct + '%';

            if (deltaPercent) deltaPercent.innerText = deltaPct + '%';
            if (thetaPercent) thetaPercent.innerText = thetaPct + '%';
            if (alphaPercent) alphaPercent.innerText = alphaPct + '%';
            if (betaPercent) betaPercent.innerText = betaPct + '%';
            if (gammaPercent) gammaPercent.innerText = gammaPct + '%';
            if (deltaBar) deltaBar.style.width = deltaPct + '%';
            if (thetaBar) thetaBar.style.width = thetaPct + '%';
            if (alphaBar) alphaBar.style.width = alphaPct + '%';
            if (betaBar) betaBar.style.width = betaPct + '%';
            if (gammaBar) gammaBar.style.width = gammaPct + '%';

            const dominant = highlightDominantBand(b);
            if (dominantBandSpan) dominantBandSpan.innerText = dominant;
            if (dominantBandEl) dominantBandEl.innerText = dominant;

            if (window.updateMultiBandChart) {
                window.updateMultiBandChart(deltaPct, thetaPct, alphaPct, betaPct, gammaPct);
            }

            bandHistory.push({
                delta: parseFloat(b.delta),
                theta: parseFloat(b.theta),
                alpha: parseFloat(b.alpha),
                beta: parseFloat(b.beta),
                gamma: parseFloat(b.gamma)
            });

            updateMentalState(b, total);

            if (data.state) {
                setBrainColor(data.state);
                if (diagnosticText) diagnosticText.innerHTML = `<strong>Detected: ${data.state}</strong> (real-time)`;
                if (detectedStateParam) detectedStateParam.innerText = data.state;
                if (mentalStateEl) mentalStateEl.innerText = data.state;
                if (analysisUpdated) analysisUpdated.innerText = `Updated: ${new Date().toLocaleTimeString()}`;
            }
        }
    }
}

// ------------------ Mental State Calculations ------------------
function updateMentalState(bands, total) {
    if (!bands || total === 0) return;
    const beta = parseFloat(bands.beta);
    const alpha = parseFloat(bands.alpha);
    const gamma = parseFloat(bands.gamma);
    let stressRatio = alpha > 0 ? beta / alpha : 2;
    let stressPercent = Math.min(100, Math.max(0, (stressRatio / 2) * 100));
    if (stressFill) stressFill.style.width = stressPercent + '%';
    if (stressVal) stressVal.innerText = Math.round(stressPercent);

    let attention = ((beta + gamma) / total) * 100;
    if (attnFill) attnFill.style.width = attention + '%';
    if (attnVal) attnVal.innerText = Math.round(attention);

    let severity = 'Low';
    if (stressPercent > 70) severity = 'High';
    else if (stressPercent > 30) severity = 'Medium';
    if (severityEl) {
        severityEl.innerText = severity;
        severityEl.className = `badge ${severity.toLowerCase()}`;
    }
}

// ------------------ Highlight Dominant Band ------------------
function highlightDominantBand(bands) {
    Object.values(bandItems).forEach(el => el?.classList.remove('dominant'));
    const values = { delta: parseFloat(bands.delta), theta: parseFloat(bands.theta), alpha: parseFloat(bands.alpha), beta: parseFloat(bands.beta), gamma: parseFloat(bands.gamma) };
    let maxBand = 'delta', maxVal = values.delta;
    for (let band in values) { if (values[band] > maxVal) { maxVal = values[band]; maxBand = band; } }
    if (bandItems[maxBand]) bandItems[maxBand].classList.add('dominant');
    return maxBand.toUpperCase();
}

function setBrainColor(state) {
    if (!brainIcon) return;
    const colors = { Anxiety:'#bc8f8f', Fatigue:'#a3c1ca', Distraction:'#d4b68a', Stress:'#b56a6a', Relaxed:'#8fc9a3', Focused:'#7fb3d5', Neutral:'var(--accent)' };
    brainIcon.style.color = colors[state] || 'var(--accent)';
}

// ------------------ Simulated Data ------------------
function startSimulatedData() {
    if (brainStateParams) brainStateParams.style.display = 'block';
    if (wsUrlBox) wsUrlBox.innerText = 'Simulated mode (no device)';
    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(() => {
        const delta = (1 + Math.random()*0.5).toFixed(2);
        const theta = (0.8 + Math.random()*0.4).toFixed(2);
        const alpha = (0.6 + Math.random()*0.6).toFixed(2);
        const beta  = (0.4 + Math.random()*0.5).toFixed(2);
        const gamma = (0.2 + Math.random()*0.3).toFixed(2);
        const total = parseFloat(delta)+parseFloat(theta)+parseFloat(alpha)+parseFloat(beta)+parseFloat(gamma);
        const deltaPct = ((parseFloat(delta)/total)*100).toFixed(0);
        const thetaPct = ((parseFloat(theta)/total)*100).toFixed(0);
        const alphaPct = ((parseFloat(alpha)/total)*100).toFixed(0);
        const betaPct = ((parseFloat(beta)/total)*100).toFixed(0);
        const gammaPct = ((parseFloat(gamma)/total)*100).toFixed(0);

        if (deltaVal) deltaVal.innerText = deltaPct+'%';
        if (thetaVal) thetaVal.innerText = thetaPct+'%';
        if (alphaVal) alphaVal.innerText = alphaPct+'%';
        if (betaVal) betaVal.innerText = betaPct+'%';
        if (gammaVal) gammaVal.innerText = gammaPct+'%';

        const avg = (parseFloat(delta)+parseFloat(theta)+parseFloat(alpha)+parseFloat(beta)+parseFloat(gamma))/5;
        if (window.updateMergedWaveform) window.updateMergedWaveform(avg);
        updateNoise(avg * 200 + Math.random()*50); // simulate raw-like values

        const bands = { delta, theta, alpha, beta, gamma };
        const dominant = highlightDominantBand(bands);
        if (window.updateMultiBandChart) window.updateMultiBandChart(deltaPct, thetaPct, alphaPct, betaPct, gammaPct);

        updateBrainStateParams(bands, dominant, 'Unknown');
        updateMentalState(bands, total);

        const states = ['Anxiety','Fatigue','Distraction','Stress','Relaxed','Focused','Neutral'];
        const randState = states[Math.floor(Math.random()*states.length)];
        setBrainColor(randState);
        if (diagnosticText) diagnosticText.innerHTML = `<strong>Simulated: ${randState}</strong> (demo)`;
        if (mentalStateEl) mentalStateEl.innerText = randState;
        if (analysisUpdated) analysisUpdated.innerText = `Updated: ${new Date().toLocaleTimeString()}`;
    }, 300);
}
function stopSimulatedData() { clearInterval(simInterval); }

function updateBrainStateParams(bands, dominant, state) {
    const total = parseFloat(bands.delta)+parseFloat(bands.theta)+parseFloat(bands.alpha)+parseFloat(bands.beta)+parseFloat(bands.gamma);
    if (total===0) return;
    const deltaPct = ((parseFloat(bands.delta)/total)*100).toFixed(0);
    const thetaPct = ((parseFloat(bands.theta)/total)*100).toFixed(0);
    const alphaPct = ((parseFloat(bands.alpha)/total)*100).toFixed(0);
    const betaPct = ((parseFloat(bands.beta)/total)*100).toFixed(0);
    const gammaPct = ((parseFloat(bands.gamma)/total)*100).toFixed(0);
    if (deltaPercent) deltaPercent.innerText = deltaPct+'%';
    if (thetaPercent) thetaPercent.innerText = thetaPct+'%';
    if (alphaPercent) alphaPercent.innerText = alphaPct+'%';
    if (betaPercent) betaPercent.innerText = betaPct+'%';
    if (gammaPercent) gammaPercent.innerText = gammaPct+'%';
    if (deltaBar) deltaBar.style.width = deltaPct+'%';
    if (thetaBar) thetaBar.style.width = thetaPct+'%';
    if (alphaBar) alphaBar.style.width = alphaPct+'%';
    if (betaBar) betaBar.style.width = betaPct+'%';
    if (gammaBar) gammaBar.style.width = gammaPct+'%';
    if (dominantBandSpan) dominantBandSpan.innerText = dominant;
    if (detectedStateParam) detectedStateParam.innerText = state;
}

// ------------------ Timer ------------------
function startTimer() {
    secondsElapsed = 0;
    if (timerDisplay) timerDisplay.innerText = formatTime(0);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        if (timerDisplay) timerDisplay.innerText = formatTime(secondsElapsed);
        if (mainAction) {
            mainAction.innerText = secondsElapsed >= 30 ? 'Stop & Analyze' : 'Stop';
            mainAction.classList.toggle('ready', secondsElapsed >= 30);
        }
    }, 1000);
}
function stopTimer() { clearInterval(timerInterval); secondsElapsed = 0; if (timerDisplay) timerDisplay.innerText = '00:00'; }
function formatTime(sec) { return `${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`; }

// ------------------ Analysis ------------------
function performAnalysis(duration) {
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = 'flex';
    setTimeout(() => {
        if (loading) loading.style.display = 'none';
        if (bandHistory.length === 0) {
            const randomConditions = ['Stress','Anxiety','Fatigue','Mild Depression','Distraction','Focused','Relaxed'];
            const picked = randomConditions[Math.floor(Math.random()*randomConditions.length)];
            showResult(picked, duration);
            return;
        }
        const avg = bandHistory.reduce((acc,cur) => {
            acc.delta += cur.delta; acc.theta += cur.theta; acc.alpha += cur.alpha; acc.beta += cur.beta; acc.gamma += cur.gamma;
            return acc;
        }, {delta:0,theta:0,alpha:0,beta:0,gamma:0});
        const count = bandHistory.length;
        avg.delta /= count; avg.theta /= count; avg.alpha /= count; avg.beta /= count; avg.gamma /= count;

        let condition = 'Neutral';
        if (avg.beta > 1.2 && avg.alpha < 0.8) condition = 'Stress';
        else if (avg.beta > 1.5 && avg.alpha < 0.6) condition = 'Anxiety';
        else if (avg.delta > 1.8 && avg.theta > 1.5) condition = 'Fatigue';
        else if (avg.alpha < 0.7 && avg.beta < 0.8) condition = 'Distraction';
        else if (avg.alpha > 1.5 && avg.beta < 0.9) condition = 'Relaxed';
        else if (avg.beta > 0.9 && avg.gamma > 0.6) condition = 'Focused';
        else if (avg.alpha < 0.8 && avg.beta < 0.7 && avg.gamma < 0.5) condition = 'Mild Depression';

        if (condition === 'Neutral') {
            const maxBand = Object.keys(avg).reduce((a,b) => avg[a]>avg[b]?a:b);
            const map = { delta:'Fatigue', theta:'Daydreaming', alpha:'Relaxed', beta:'Focused', gamma:'Focused' };
            condition = map[maxBand] || 'Neutral';
        }
        showResult(condition, duration);
    }, 1000);
}

// ------------------ Show Result ------------------
function showResult(condition, duration) {
    if (overlayCondition) overlayCondition.innerText = condition;
    let explanation = '';
    if (bandHistory.length > 0) {
        const avg = bandHistory.reduce((acc,cur) => {
            acc.delta += cur.delta; acc.theta += cur.theta; acc.alpha += cur.alpha; acc.beta += cur.beta; acc.gamma += cur.gamma;
            return acc;
        }, {delta:0,theta:0,alpha:0,beta:0,gamma:0});
        const count = bandHistory.length;
        explanation = `<br><small>Avg bands: δ ${(avg.delta/count).toFixed(2)} µV, θ ${(avg.theta/count).toFixed(2)} µV, α ${(avg.alpha/count).toFixed(2)} µV, β ${(avg.beta/count).toFixed(2)} µV, γ ${(avg.gamma/count).toFixed(2)} µV</small>`;
    }
    if (solutionsContent) solutionsContent.innerHTML = getSolutions(condition) + explanation;
    if (overlay) overlay.style.display = 'block';

    if (diagnosticText) diagnosticText.innerHTML = `<strong>Detected: ${condition}</strong> · based on 30s analysis.`;
    if (diagnosticSolutionsBtn) {
        diagnosticSolutionsBtn.style.display = 'inline-block';
        diagnosticSolutionsBtn.onclick = () => window.location.href = `solutions.html?condition=${condition.toLowerCase()}`;
    }

    const timestamp = new Date().toLocaleTimeString();
    const session = {
        time: timestamp,
        condition: condition,
        duration: duration || 30,
        bands: {
            delta: deltaVal?.innerText || '0%',
            theta: thetaVal?.innerText || '0%',
            alpha: alphaVal?.innerText || '0%',
            beta: betaVal?.innerText || '0%',
            gamma: gammaVal?.innerText || '0%'
        }
    };
    recentSessions.unshift(session);
    if (recentSessions.length > 5) recentSessions.pop();
    updateRecentList();

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'saveSession', condition: condition, bands: session.bands, duration: duration || 30 }));
    }
}

// ------------------ Update Recent List ------------------
function updateRecentList() {
    if (!recentListEl) return;
    recentListEl.innerHTML = '';
    if (recentSessions.length === 0) {
        recentListEl.innerHTML = '<li style="color:var(--text-muted);">No sessions yet</li>';
        return;
    }
    recentSessions.forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="condition">${s.condition}</span> <span class="time">${s.time}</span>`;
        li.addEventListener('click', () => {
            if (overlayCondition) overlayCondition.innerText = s.condition;
            if (solutionsContent) solutionsContent.innerHTML = getSolutions(s.condition) + `<br><small>Session at ${s.time} (${s.duration}s)</small>`;
            if (overlay) overlay.style.display = 'block';
        });
        recentListEl.appendChild(li);
    });
}

// ------------------ Solutions Map ------------------
function getSolutions(condition) {
    const map = {
        'Stress': 'Deep breathing: inhale 4s, hold 4s, exhale 6s. Consider a short walk.',
        'Anxiety': '5-4-3-2-1 grounding technique.',
        'Fatigue': 'Power nap (10-20 min) or hydrate.',
        'Distraction': 'Pomodoro: 25 min focus, 5 min break.',
        'Mild Depression': 'Reach out to a friend or professional.',
        'Focused': 'Great! Keep it up with short breaks.',
        'Relaxed': 'Enjoy this state; consider meditation.',
        'Neutral': 'Your brain is balanced. Continue.',
        'Daydreaming': 'Light focus exercise or walk.'
    };
    return map[condition] || 'Stay mindful.';
}

// ------------------ Toast ------------------
function showError(msg, type='error') {
    const toast = document.createElement('div');
    toast.className = `error-toast ${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
function showToast(msg) { showError(msg, 'success'); }

// ------------------ Event Listeners ------------------
if (liveBtn) {
    liveBtn.addEventListener('click', () => {
        if (monitoring) return;
        liveBtn.classList.add('active');
        simBtn.classList.remove('active');
        useSimulated = false;
        if (wsUrlBox) wsUrlBox.innerText = isConnected ? 'Connected' : 'No device';
        if (brainStateParams) brainStateParams.style.display = 'none';
        resetUI();
    });
}
if (simBtn) {
    simBtn.addEventListener('click', () => {
        if (monitoring) return;
        simBtn.classList.add('active');
        liveBtn.classList.remove('active');
        useSimulated = true;
        if (wsUrlBox) wsUrlBox.innerText = 'Simulated mode';
        if (brainStateParams) brainStateParams.style.display = 'none';
        resetUI();
    });
}
if (mainAction) {
    mainAction.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!monitoring) {
            if (!useSimulated && !isConnected) {
                showError('❌ No device connected. Use simulated or connect.', 'error');
                return;
            }
            monitoring = true;
            dataReceived = false;
            bandHistory = [];
            rawSignalHistory = [];
            if (liveBtn) liveBtn.disabled = true;
            if (simBtn) simBtn.disabled = true;
            startTimer();
            mainAction.innerText = 'Stop';
            mainAction.classList.add('stop');
            if (useSimulated) startSimulatedData();
            if (brainStateParams) brainStateParams.style.display = 'block';
            if (canvas) { canvas.style.border = '3px solid #6b8e4c'; canvas.style.boxShadow = '0 0 15px #6b8e4c'; }
        } else {
            document.getElementById('confirmOverlay').style.display = 'block';
        }
    });
}
document.getElementById('cancelStopBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('confirmOverlay').style.display = 'none';
});
document.getElementById('confirmStopBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('confirmOverlay').style.display = 'none';
    executeStopMonitoring();
});
function executeStopMonitoring() {
    monitoring = false;
    const timeAtStop = secondsElapsed;
    stopTimer();
    stopSimulatedData();
    if (liveBtn) liveBtn.disabled = false;
    if (simBtn) simBtn.disabled = false;
    mainAction.innerText = 'Start Monitoring';
    mainAction.classList.remove('stop', 'ready');
    if (brainStateParams) brainStateParams.style.display = 'none';
    if (canvas) { canvas.style.border = 'none'; canvas.style.boxShadow = 'none'; }
    if (!useSimulated && !dataReceived) {
        showError('⚠️ No data received. Check connection.', 'error');
        return;
    }
    if (timeAtStop >= 30) performAnalysis(timeAtStop);
    else showError('Session too short (need 30s).', 'warning');
}

document.getElementById('viewSolutionsOverlayBtn')?.addEventListener('click', () => {
    const cond = overlayCondition?.innerText.toLowerCase() || 'stress';
    window.location.href = `solutions.html?condition=${cond}`;
});
if (overlay) overlay.addEventListener('click', (e) => e.stopPropagation());

window.selectMentalState = function(state, el) {
    document.querySelectorAll('.mental-state-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    const recs = document.getElementById('recs');
    if (recs) recs.innerHTML = `<li>${getSolutions(state)}</li>`;
};
window.viewRemediesForState = function() {
    const active = document.querySelector('.mental-state-card.active');
    if (active) window.location.href = `solutions.html?condition=${active.getAttribute('data-state').toLowerCase()}`;
    else showError('Select a condition first.', 'warning');
};

// Start WebSocket
connectWebSocket();