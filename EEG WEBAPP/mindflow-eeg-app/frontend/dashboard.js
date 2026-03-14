// dashboard.js – Full EEG monitor logic (restored with bar widths and dominant chart)
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

// DOM elements (mapped to new IDs)
const connectionStatus = document.getElementById('connectionStatus');
const streamStatus = document.getElementById('streamStatus');
const mainAction = document.getElementById('mainActionBtn');
const timerDisplay = document.getElementById('timerDisplay');
if (timerDisplay) timerDisplay.innerText = '00:00';
const deltaVal = document.getElementById('bwDelta');
const thetaVal = document.getElementById('bwTheta');
const alphaVal = document.getElementById('bwAlpha');
const betaVal = document.getElementById('bwBeta');
const gammaVal = document.getElementById('bwGamma');
const signalQuality = document.getElementById('signalQuality');
const qualityText = document.getElementById('qualityText');
const sampleInfo = document.getElementById('liveValue');
const diagnosticText = document.getElementById('diagnosticText');
const recentList = document.getElementById('recs'); // using recs for recommendations
const overlay = document.getElementById('resultOverlay');
const overlayCondition = document.getElementById('overlayCondition');
const solutionsContent = document.getElementById('solutionsContent');
const brainIcon = document.querySelector('.app-header i'); // brain icon in header
const wsUrlBox = document.getElementById('wsUrlBox');
const diagnosticSolutionsBtn = document.getElementById('diagnosticSolutionsBtn');
const liveBtn = document.getElementById('liveBtn');
const simBtn = document.getElementById('simBtn');
const canvas = document.getElementById('eegCanvas');

// Brain state parameters (new IDs)
const brainStateParams = document.getElementById('brainStateParams');
const deltaPercent = document.getElementById('paramDeltaPct');
const thetaPercent = document.getElementById('paramThetaPct');
const alphaPercent = document.getElementById('paramAlphaPct');
const betaPercent = document.getElementById('paramBetaPct');
const gammaPercent = document.getElementById('paramGammaPct');
const dominantBandSpan = document.getElementById('paramDominantWave');
const detectedStateParam = document.getElementById('paramDetectedState');
// Bar fill elements
const deltaBar = document.getElementById('paramDeltaBar');
const thetaBar = document.getElementById('paramThetaBar');
const alphaBar = document.getElementById('paramAlphaBar');
const betaBar = document.getElementById('paramBetaBar');
const gammaBar = document.getElementById('paramGammaBar');

// Band items for highlight (param cards)
const bandItems = {
    delta: document.getElementById('cardDelta'),
    theta: document.getElementById('cardTheta'),
    alpha: document.getElementById('cardAlpha'),
    beta: document.getElementById('cardBeta'),
    gamma: document.getElementById('cardGamma')
};

let recentSessions = [];
let bwRadarChart = null;

function getChartColors() {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        // Professional Purple Gradient for Dark Mode
        return ['#7c3aed', '#9333ea', '#a855f7', '#c084fc', '#e9d5ff'];
    } else {
        // Professional Teal Gradient for Light Mode
        return ['#2f7d8f', '#459ba4', '#70b7bf', '#99d3d9', '#c2eff3'];
    }
}
function initRadarChart() {
    const ctx = document.getElementById('bwPie'); // Keeping the ID for simplicity, but treat as Radar
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
                backgroundColor: isDark ? 'rgba(124, 58, 237, 0.4)' : 'rgba(47, 125, 143, 0.4)',
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
            scales: {
                r: {
                    angleLines: {
                        color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    },
                    grid: {
                        color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    },
                    pointLabels: {
                        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        font: {
                            size: 13,
                            weight: '600',
                            family: 'Inter'
                        }
                    },
                    ticks: {
                        display: false,
                        maxTicksLimit: 5
                    },
                    suggestedMin: 0,
                    suggestedMax: 50
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            }
        }
    });

    // Listen for theme changes to update radar colors live
    const observer = new MutationObserver(() => {
        if (bwRadarChart) {
            const isDarkNow = document.body.classList.contains('dark-mode');
            const newColors = getChartColors();
            bwRadarChart.data.datasets[0].backgroundColor = isDarkNow ? 'rgba(124, 58, 237, 0.4)' : 'rgba(47, 125, 143, 0.4)';
            bwRadarChart.data.datasets[0].borderColor = isDarkNow ? '#7c3aed' : '#2f7d8f';
            bwRadarChart.data.datasets[0].pointBackgroundColor = newColors;
            bwRadarChart.options.scales.r.angleLines.color = isDarkNow ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            bwRadarChart.options.scales.r.grid.color = isDarkNow ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            bwRadarChart.options.scales.r.pointLabels.color = isDarkNow ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
            bwRadarChart.update('none');
        }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

document.addEventListener('DOMContentLoaded', initRadarChart);

// ---------- Reset UI on disconnect ----------
function resetUI() {
    if (deltaVal) deltaVal.innerText = '0%';
    if (thetaVal) thetaVal.innerText = '0%';
    if (alphaVal) alphaVal.innerText = '0%';
    if (betaVal) betaVal.innerText = '0%';
    if (gammaVal) gammaVal.innerText = '0%';
    if (signalQuality) signalQuality.innerText = '0.0';
    if (qualityText) qualityText.innerText = '0.0% estimated';
    if (sampleInfo) sampleInfo.innerText = 'Value: —';

    if (deltaPercent) deltaPercent.innerText = '0%';
    if (thetaPercent) thetaPercent.innerText = '0%';
    if (alphaPercent) alphaPercent.innerText = '0%';
    if (betaPercent) betaPercent.innerText = '0%';
    if (gammaPercent) gammaPercent.innerText = '0%';
    // Reset bars
    if (deltaBar) deltaBar.style.width = '0%';
    if (thetaBar) thetaBar.style.width = '0%';
    if (alphaBar) alphaBar.style.width = '0%';
    if (betaBar) betaBar.style.width = '0%';
    if (gammaBar) gammaBar.style.width = '0%';
    if (dominantBandSpan) dominantBandSpan.innerText = '—';
    if (detectedStateParam) detectedStateParam.innerText = 'Waiting for data…';

    if (window.resetMergedWaveform) window.resetMergedWaveform();
    if (window.resetDominantChart) window.resetDominantChart();

    if (brainIcon) brainIcon.style.color = 'var(--accent)'; 

    bandHistory = [];
    dataReceived = false;
}

// ---------- WebSocket ----------
// ---------- WebSocket ----------
function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) return;
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
        isConnected = true;
        reconnectAttempts = 0;
        if (connectionStatus) {
            connectionStatus.innerText = 'Connected';
            // Use CSS variables for a theme-friendly green
            connectionStatus.style.background = 'rgba(34, 197, 94, 0.15)';
            connectionStatus.style.color = 'var(--good)';
            connectionStatus.style.borderColor = 'var(--good)';
        }
        if (!useSimulated) {
            if (streamStatus) {
                streamStatus.innerText = 'CONNECTED';
                streamStatus.style.background = 'rgba(34, 197, 94, 0.15)';
                streamStatus.style.color = 'var(--good)';
            }
            if (brainStateParams) brainStateParams.style.display = 'none';
        }
    };
    
    socket.onclose = () => {
        isConnected = false;
        if (connectionStatus) {
            connectionStatus.innerText = 'Disconnected';
            // Clear inline styles so it falls back to your dark/light mode CSS variables
            connectionStatus.style.background = '';
            connectionStatus.style.color = '';
            connectionStatus.style.borderColor = '';
        }
        if (!useSimulated) {
            if (streamStatus) {
                streamStatus.innerText = 'DISCONNECTED';
                streamStatus.style.background = '';
                streamStatus.style.color = '';
            }
            if (wsUrlBox) wsUrlBox.innerText = 'No device connected';
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
            if (wsUrlBox) {
                if (data.port) {
                    wsUrlBox.innerText = `Device on ${data.port}`;
                } else {
                    wsUrlBox.innerText = 'No device connected';
                }
            }
            return;
        }
        dataReceived = true;
        handleIncomingData(data);
    };
}

function handleIncomingData(data) {
    if (data.type === 'raw') {
        if (sampleInfo) sampleInfo.innerText = `Value: ${data.sample.toFixed(2)}`;
        // Update merged waveform with raw sample (or use average of bands later)
        if (window.updateMergedWaveform) window.updateMergedWaveform(data.sample);
        let qual = (70 + Math.random() * 20).toFixed(1);
        if (signalQuality) signalQuality.innerText = qual;
        if (qualityText) qualityText.innerText = qual + '%';
    } else if (data.type === 'eeg') {
        const b = data.bands;
        const total = parseFloat(b.delta) + parseFloat(b.theta) + parseFloat(b.alpha) + parseFloat(b.beta) + parseFloat(b.gamma);
        if (total > 0) {
            const deltaPct = ((parseFloat(b.delta) / total) * 100).toFixed(0);
            const thetaPct = ((parseFloat(b.theta) / total) * 100).toFixed(0);
            const alphaPct = ((parseFloat(b.alpha) / total) * 100).toFixed(0);
            const betaPct = ((parseFloat(b.beta) / total) * 100).toFixed(0);
            const gammaPct = ((parseFloat(b.gamma) / total) * 100).toFixed(0);
            if (bwRadarChart) {
            bwRadarChart.data.datasets[0].data = [
                parseFloat(deltaPct),
                parseFloat(thetaPct),
                parseFloat(alphaPct),
                parseFloat(betaPct),
                parseFloat(gammaPct)
            ];
            bwRadarChart.update();
        }
           // Update the colored bar backgrounds
        if (document.getElementById('fillDelta')) document.getElementById('fillDelta').style.width = deltaPct + '%';
        if (document.getElementById('fillTheta')) document.getElementById('fillTheta').style.width = thetaPct + '%';
        if (document.getElementById('fillAlpha')) document.getElementById('fillAlpha').style.width = alphaPct + '%';
        if (document.getElementById('fillBeta')) document.getElementById('fillBeta').style.width = betaPct + '%';
        if (document.getElementById('fillGamma')) document.getElementById('fillGamma').style.width = gammaPct + '%';
        }

        // Use average of bands for merged waveform
        const avg = (parseFloat(b.delta) + parseFloat(b.theta) + parseFloat(b.alpha) + parseFloat(b.beta) + parseFloat(b.gamma)) / 5;
        if (window.updateMergedWaveform) window.updateMergedWaveform(avg);

        bandHistory.push({
            delta: parseFloat(b.delta),
            theta: parseFloat(b.theta),
            alpha: parseFloat(b.alpha),
            beta: parseFloat(b.beta),
            gamma: parseFloat(b.gamma)
        });

        const dominant = highlightDominantBand(b);
        // Update dominant chart
        if (window.updateDominantChart) window.updateDominantChart(dominant);

        updateBrainStateParams(b, dominant, data.state || 'Unknown');

        if (data.state) {
            setBrainColor(data.state);
            if (diagnosticText) diagnosticText.innerHTML = `<strong>Detected: ${data.state}</strong> (real-time)`;
            if (detectedStateParam) detectedStateParam.innerText = data.state;
        }
    } else if (data.type === 'sessions') {
        recentSessions = data.sessions;
        updateRecentList();
    }
}

// Highlight dominant band (param cards)
function highlightDominantBand(bands) {
    Object.values(bandItems).forEach(el => {
        if (el) el.classList.remove('dominant');
    });
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
    const deltaPct = ((parseFloat(bands.delta) / total) * 100).toFixed(0);
    const thetaPct = ((parseFloat(bands.theta) / total) * 100).toFixed(0);
    const alphaPct = ((parseFloat(bands.alpha) / total) * 100).toFixed(0);
    const betaPct = ((parseFloat(bands.beta) / total) * 100).toFixed(0);
    const gammaPct = ((parseFloat(bands.gamma) / total) * 100).toFixed(0);

    if (deltaPercent) deltaPercent.innerText = deltaPct + '%';
    if (thetaPercent) thetaPercent.innerText = thetaPct + '%';
    if (alphaPercent) alphaPercent.innerText = alphaPct + '%';
    if (betaPercent) betaPercent.innerText = betaPct + '%';
    if (gammaPercent) gammaPercent.innerText = gammaPct + '%';

    // Update bar widths
    if (deltaBar) deltaBar.style.width = deltaPct + '%';
    if (thetaBar) thetaBar.style.width = thetaPct + '%';
    if (alphaBar) alphaBar.style.width = alphaPct + '%';
    if (betaBar) betaBar.style.width = betaPct + '%';
    if (gammaBar) gammaBar.style.width = gammaPct + '%';

    if (dominantBandSpan) dominantBandSpan.innerText = dominant;
    if (detectedStateParam) detectedStateParam.innerText = state;
}

function setBrainColor(state) {
    if (!brainIcon) return;
    const colors = {
        'Anxiety': '#bc8f8f',
        'Fatigue': '#a3c1ca',
        'Distraction': '#d4b68a',
        'Stress': '#b56a6a',
        'Relaxed': '#8fc9a3',
        'Focused': '#7fb3d5',
        'Neutral': 'var(--accent)'
    };
    brainIcon.style.color = colors[state] || 'var(--accent)';
}

// Simulated data (for demo)
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
        
        const total = parseFloat(delta) + parseFloat(theta) + parseFloat(alpha) + parseFloat(beta) + parseFloat(gamma);
        const deltaPct = ((parseFloat(delta) / total) * 100).toFixed(0);
        const thetaPct = ((parseFloat(theta) / total) * 100).toFixed(0);
        const alphaPct = ((parseFloat(alpha) / total) * 100).toFixed(0);
        const betaPct = ((parseFloat(beta) / total) * 100).toFixed(0);
        const gammaPct = ((parseFloat(gamma) / total) * 100).toFixed(0);
        if (deltaVal) deltaVal.innerText = deltaPct + '%';
        if (thetaVal) thetaVal.innerText = thetaPct + '%';
        if (alphaVal) alphaVal.innerText = alphaPct + '%';
        if (betaVal) betaVal.innerText = betaPct + '%';
        if (gammaVal) gammaVal.innerText = gammaPct + '%';

        const avg = (parseFloat(delta) + parseFloat(theta) + parseFloat(alpha) + parseFloat(beta) + parseFloat(gamma)) / 5;
        if (window.updateMergedWaveform) window.updateMergedWaveform(avg);

        const bands = { delta, theta, alpha, beta, gamma };
        const dominant = highlightDominantBand(bands);
        if (window.updateDominantChart) window.updateDominantChart(dominant);
        updateBrainStateParams(bands, dominant, 'Unknown');

        const qual = (70 + Math.random()*20).toFixed(1);
        if (signalQuality) signalQuality.innerText = qual;
        if (qualityText) qualityText.innerText = qual + '%';

        const fakeSample = parseFloat(alpha)*0.8 + Math.random()*1.5;
        if (sampleInfo) sampleInfo.innerText = `Value: ${fakeSample.toFixed(2)}`;

        const states = ['Anxiety','Fatigue','Distraction','Stress','Relaxed','Focused','Neutral'];
        const randState = states[Math.floor(Math.random()*states.length)];
        setBrainColor(randState);
        if (diagnosticText) diagnosticText.innerHTML = `<strong>Simulated: ${randState}</strong> (demo)`;
    }, 300);
}

function stopSimulatedData() {
    if (simInterval) clearInterval(simInterval);
    if (wsUrlBox) wsUrlBox.innerText = 'Simulated mode stopped';
}

// Timer functions
function startTimer() {
    secondsElapsed = 0;
    if (timerDisplay) timerDisplay.innerText = formatTime(0);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        if (timerDisplay) timerDisplay.innerText = formatTime(secondsElapsed);
        if (mainAction) {
            if (secondsElapsed >= 30) {
                mainAction.innerText = 'Stop & Analyze';
                mainAction.classList.add('ready');
            } else {
                mainAction.innerText = 'Stop';
                mainAction.classList.remove('ready');
            }
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    // Reset the variables and the display text
    secondsElapsed = 0;
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.innerText = '00:00';
    }
}

function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Analysis from EEG (with loading)
function performAnalysis() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = 'flex';
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) loadingText.innerText = 'Analyzing your EEG data...';

    setTimeout(() => {
        if (loading) loading.style.display = 'none';

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

function showResult(condition, duration) {
    // Safely grab elements dynamically so it NEVER crashes
    const resultOverlay = document.getElementById('resultOverlay');
    const overlayCond = document.getElementById('overlayCondition');
    const solContent = document.getElementById('solutionsContent');
    
    if (overlayCond) overlayCond.innerText = condition;
    if (solContent) solContent.innerHTML = getSolutions(condition);
    
    // Force the popup to display on top of everything
    if (resultOverlay) {
        resultOverlay.style.display = 'block';
        resultOverlay.style.zIndex = '5000';
    }

    // Save session safely
    if (typeof socket !== 'undefined' && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'saveSession',
            condition: condition,
            bands: {
                delta: document.getElementById('bwDelta') ? document.getElementById('bwDelta').innerText : '0',
                theta: document.getElementById('bwTheta') ? document.getElementById('bwTheta').innerText : '0',
                alpha: document.getElementById('bwAlpha') ? document.getElementById('bwAlpha').innerText : '0',
                beta: document.getElementById('bwBeta') ? document.getElementById('bwBeta').innerText : '0',
                gamma: document.getElementById('bwGamma') ? document.getElementById('bwGamma').innerText : '0'
            },
            duration: duration || 30 
        }));
    }

    // Update the recent list safely
    if (typeof recentSessions !== 'undefined') {
        const timestamp = new Date().toLocaleTimeString();
        recentSessions.unshift({ 
            time: timestamp, 
            condition: condition, 
            bands: {
                delta: document.getElementById('bwDelta') ? document.getElementById('bwDelta').innerText : '0',
                theta: document.getElementById('bwTheta') ? document.getElementById('bwTheta').innerText : '0',
                alpha: document.getElementById('bwAlpha') ? document.getElementById('bwAlpha').innerText : '0',
                beta: document.getElementById('bwBeta') ? document.getElementById('bwBeta').innerText : '0',
                gamma: document.getElementById('bwGamma') ? document.getElementById('bwGamma').innerText : '0'
            }
        });
        if (typeof updateRecentList === 'function') updateRecentList();
    }
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
    if (recentList) {
        recentList.innerHTML = '';
        if (recentSessions.length === 0) {
            recentList.innerHTML = '<li>No previous sessions yet.</li>';
        } else {
            recentSessions.slice(0,5).forEach(s => {
                const li = document.createElement('li');
                li.style.cursor = 'pointer';
                li.innerHTML = `${s.condition} <span style="color:var(--text-muted);">${s.time}</span>`;
                li.addEventListener('click', () => {
                    window.location.href = `solutions.html?condition=${s.condition.toLowerCase()}`;
                });
                recentList.appendChild(li);
            });
        }
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
if (liveBtn) {
    liveBtn.addEventListener('click', () => {
        if (monitoring) return;
        liveBtn.classList.add('active');
        if (simBtn) simBtn.classList.remove('active');
        useSimulated = false;
        if (streamStatus) {
            streamStatus.innerText = isConnected ? 'CONNECTED' : 'DISCONNECTED';
            streamStatus.style.background = isConnected ? '#3c879a' : '#a3c1ca';
        }
        if (brainStateParams) brainStateParams.style.display = 'none';
        resetUI();
    });
}

if (simBtn) {
    simBtn.addEventListener('click', () => {
        if (monitoring) return;
        simBtn.classList.add('active');
        if (liveBtn) liveBtn.classList.remove('active');
        useSimulated = true;
        if (streamStatus) {
            streamStatus.innerText = 'SIMULATED';
            streamStatus.style.background = '#8a9aa0';
        }
        if (brainStateParams) brainStateParams.style.display = 'none';
        if (wsUrlBox) wsUrlBox.innerText = 'Simulated mode';
        resetUI();
    });
}

if (mainAction) {
    mainAction.addEventListener('click', (e) => {
        e.stopPropagation();

        if (!monitoring) {
            // START
            if (!useSimulated && !isConnected) {
                showError('❌ No device connected. Please connect to live device or switch to simulated feed.', 'error');
                return;
            }
            monitoring = true;
            dataReceived = false;
            bandHistory = [];
            if (liveBtn) liveBtn.disabled = true;
            if (simBtn) simBtn.disabled = true;
            startTimer();
            mainAction.innerText = 'Stop';
            mainAction.classList.add('stop');
            if (useSimulated) startSimulatedData();

            if (brainStateParams) brainStateParams.style.display = 'block';

            if (canvas) {
                canvas.style.border = '3px solid #6b8e4c';
                canvas.style.boxShadow = '0 0 15px #6b8e4c';
            }
        } else {
            // Show custom confirmation modal instead of browser confirm()
            const confirmOverlay = document.getElementById('confirmOverlay');
            if (confirmOverlay) confirmOverlay.style.display = 'block';
        }
    });
}

// Handle Custom Confirmation Modal Buttons
const cancelStopBtn = document.getElementById('cancelStopBtn');
const confirmStopBtn = document.getElementById('confirmStopBtn');
const confirmOverlay = document.getElementById('confirmOverlay');

if (cancelStopBtn) {
    cancelStopBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevents page reload
        if (confirmOverlay) confirmOverlay.style.display = 'none';
    });
}

if (confirmStopBtn) {
    confirmStopBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevents page reload
        if (confirmOverlay) confirmOverlay.style.display = 'none';
        executeStopMonitoring();
    });
}

// Extracted stop logic
function executeStopMonitoring() {
    monitoring = false;
    
    // Capture the elapsed time BEFORE resetting the timer
    const timeAtStop = secondsElapsed;
    
    stopTimer();
    stopSimulatedData();
    
    if (liveBtn) liveBtn.disabled = false;
    if (simBtn) simBtn.disabled = false;
    mainAction.innerText = 'Start Monitoring';
    mainAction.classList.remove('stop', 'ready');

    if (brainStateParams) brainStateParams.style.display = 'none';

    if (canvas) {
        canvas.style.border = 'none';
        canvas.style.boxShadow = 'none';
    }

    const brainIcon = document.querySelector('.topbar i.fa-brain');
    if (brainIcon) brainIcon.style.color = 'var(--accent)';

    if (!useSimulated) {
        if (streamStatus) streamStatus.innerText = isConnected ? 'CONNECTED' : 'DISCONNECTED';
        if (!dataReceived) {
            showError('⚠️ No data received from device. Check your Arduino connection.', 'error');
            return;
        }
    } else {
        if (streamStatus) streamStatus.innerText = 'SIMULATED (idle)';
    }

    // Trigger analysis using the captured time
    if (timeAtStop >= 30) {
        performAnalysis(timeAtStop); // Pass the duration down
    } else {
        showError('Session too short. Please monitor for at least 30 seconds to get an analysis.', 'warning');
    }
}

// Analysis from EEG (with loading)
function performAnalysis(duration) {
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = 'flex';
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) loadingText.innerText = 'Analyzing your EEG data...';

    setTimeout(() => {
        if (loading) loading.style.display = 'none';

        if (bandHistory.length === 0) {
            console.warn('No band history, using random');
            const randomConditions = ['Stress','Anxiety','Fatigue','Mild Depression','Distraction','Focused','Relaxed'];
            const picked = randomConditions[Math.floor(Math.random() * randomConditions.length)];
            showResult(picked, duration);
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

        showResult(condition, duration);
    }, 1000);
}

function showResult(condition, duration) {
    const resultOverlay = document.getElementById('resultOverlay');
    if (overlayCondition) overlayCondition.innerText = condition;
    if (solutionsContent) solutionsContent.innerHTML = getSolutions(condition);
    
    // Force display block to ensure it stays open
    if (resultOverlay) resultOverlay.style.display = 'block';

    if (diagnosticText) diagnosticText.innerHTML = `<strong style="color:#1a5768;">Detected: ${condition}</strong> · based on 30s EEG analysis.`;

    if (diagnosticSolutionsBtn) {
        diagnosticSolutionsBtn.style.display = 'inline-block';
        diagnosticSolutionsBtn.onclick = () => {
            window.location.href = `solutions.html?condition=${condition.toLowerCase()}`;
        };
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'saveSession',
            condition: condition,
            bands: {
                delta: deltaVal ? deltaVal.innerText : '0',
                theta: thetaVal ? thetaVal.innerText : '0',
                alpha: alphaVal ? alphaVal.innerText : '0',
                beta: betaVal ? betaVal.innerText : '0',
                gamma: gammaVal ? gammaVal.innerText : '0'
            },
            duration: duration || 30 // Send the actual captured duration
        }));
    }

    const timestamp = new Date().toLocaleTimeString();
    recentSessions.unshift({ 
        time: timestamp, 
        condition: condition, 
        bands: {
            delta: deltaVal ? deltaVal.innerText : '0',
            theta: thetaVal ? thetaVal.innerText : '0',
            alpha: alphaVal ? alphaVal.innerText : '0',
            beta: betaVal ? betaVal.innerText : '0',
            gamma: gammaVal ? gammaVal.innerText : '0'
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
    if (recentList) {
        recentList.innerHTML = '';
        if (recentSessions.length === 0) {
            recentList.innerHTML = '<li>No previous sessions yet.</li>';
        } else {
            recentSessions.slice(0,5).forEach(s => {
                const li = document.createElement('li');
                li.style.cursor = 'pointer';
                li.innerHTML = `${s.condition} <span style="color:var(--text-muted);">${s.time}</span>`;
                li.addEventListener('click', () => {
                    window.location.href = `solutions.html?condition=${s.condition.toLowerCase()}`;
                });
                recentList.appendChild(li);
            });
        }
    }
}
// Overlay button
const viewBtn = document.getElementById('viewSolutionsOverlayBtn');
if (viewBtn) {
    viewBtn.addEventListener('click', () => {
        const condition = overlayCondition ? overlayCondition.innerText.toLowerCase() : 'stress';
        window.location.href = `solutions.html?condition=${condition}`;
    });
}

// Prevent overlay from closing when clicking inside it
if (overlay) {
    overlay.addEventListener('click', (e) => e.stopPropagation());
}

// Start WebSocket
connectWebSocket();

// Functions for mental state selector
window.selectMentalState = function(state, element) {
    document.querySelectorAll('.mental-state-card').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    const recs = document.getElementById('recs');
    if (recs) {
        recs.innerHTML = getSolutions(state);
    }
};

window.viewRemediesForState = function() {
    const active = document.querySelector('.mental-state-card.active');
    if (active) {
        const state = active.getAttribute('data-state');
        window.location.href = `solutions.html?condition=${state.toLowerCase()}`;
    } else {
        showError('Please select a condition first.', 'warning');
    }
};