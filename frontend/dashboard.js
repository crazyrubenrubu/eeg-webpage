// frontend/dashboard.js
const wsUrl = "ws://localhost:8080";
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
let lastRadarData = null;
window.__EEG_STATE__ = { bands: null, state: "Waiting...", isConnected: false };

// DOM elements
const connectionStatus = document.getElementById("connectionStatus");
const mainAction = document.getElementById("mainActionBtn");
const timerDisplay = document.getElementById("timerDisplay");
const deltaVal = document.getElementById("bwDelta");
const thetaVal = document.getElementById("bwTheta");
const alphaVal = document.getElementById("bwAlpha");
const betaVal = document.getElementById("bwBeta");
const gammaVal = document.getElementById("bwGamma");
const sampleInfo = document.getElementById("liveValue");
const diagnosticText = document.getElementById("diagnosticText");
const overlay = document.getElementById("resultOverlay");
const overlayCondition = document.getElementById("overlayCondition");
const solutionsContent = document.getElementById("solutionsContent");
const brainIcon = document.querySelector(".fa-brain");
const wsUrlBox = document.getElementById("wsUrlBox");
const diagnosticSolutionsBtn = document.getElementById(
  "diagnosticSolutionsBtn",
);
const liveBtn = document.getElementById("liveBtn");
const simBtn = document.getElementById("simBtn");
const canvas = document.getElementById("eegCanvas");
const brainStateParams = document.getElementById("brainStateParams");
const deltaPercent = document.getElementById("paramDeltaPct");
const thetaPercent = document.getElementById("paramThetaPct");
const alphaPercent = document.getElementById("paramAlphaPct");
const betaPercent = document.getElementById("paramBetaPct");
const gammaPercent = document.getElementById("paramGammaPct");
const dominantBandSpan = document.getElementById("paramDominantWave");
const detectedStateParam = document.getElementById("paramDetectedState");
const deltaBar = document.getElementById("paramDeltaBar");
const thetaBar = document.getElementById("paramThetaBar");
const alphaBar = document.getElementById("paramAlphaBar");
const betaBar = document.getElementById("paramBetaBar");
const gammaBar = document.getElementById("paramGammaBar");

// Mental state elements
const dominantBandEl = document.getElementById("dominantBand");
const severityEl = document.getElementById("severity");
const mentalStateEl = document.getElementById("mentalState");
const stressFill = document.getElementById("stressFill");
const stressVal = document.getElementById("stressVal");
const attnFill = document.getElementById("attnFill");
const attnVal = document.getElementById("attnVal");
const analysisUpdated = document.getElementById("analysisUpdated");
const signalQualityBadge = document.getElementById("signalQualityBadge");

// Noise elements
const noiseFill = document.getElementById("noiseFill");
const noiseValue = document.getElementById("noiseValue");

// Recent sessions list
const recentListEl = document.getElementById("recentSessionsList");

// Parameter cards (mapped: delta=stress, theta=fatigue, alpha=lowEnergy, beta=brainOverload, gamma=relaxation)
const paramCards = {
  stress: document.getElementById("cardDelta"),
  fatigue: document.getElementById("cardTheta"),
  lowEnergy: document.getElementById("cardAlpha"),
  brainOverload: document.getElementById("cardBeta"),
  relaxation: document.getElementById("cardGamma"),
};

function loadRecentSessions() {
  const stored = localStorage.getItem("eeg_recent_sessions");
  if (stored) {
    try {
      recentSessions = JSON.parse(stored);
      updateRecentList();
    } catch (e) {
      /* ignore */
    }
  }
}
loadRecentSessions();
// ------------------ Radar Chart Init ------------------
function initRadarChart() {
  const ctx = document.getElementById("bwPie");
  if (!ctx) return;

  const isDark = document.body.classList.contains("dark-mode");
  const colors = getChartColors();
  const gridColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";

  // Destroy old chart if exists
  if (bwRadarChart) bwRadarChart.destroy();

  bwRadarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "Stress",
        "Fatigue",
        "Low Energy",
        "Brain Overload",
        "Relaxation",
      ],
      datasets: [
        {
          label: "Current State",
          data: lastRadarData || [0, 0, 0, 0, 0],
          backgroundColor: isDark
            ? "rgba(124,58,237,0.4)"
            : "rgba(47,125,143,0.4)",
          borderColor: isDark ? "#7c3aed" : "#2f7d8f",
          borderWidth: 3,
          pointBackgroundColor: colors,
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: colors,
          pointRadius: 4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          ticks: { display: false },
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          suggestedMin: 0,
          suggestedMax: 50,
        },
      },
      plugins: { legend: { display: false } },
    },
  });

  window.setRadarChart(bwRadarChart);
}
const radarObserver = new MutationObserver(() => {
  if (bwRadarChart) initRadarChart();
});
radarObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});
document.addEventListener("DOMContentLoaded", initRadarChart);

// ------------------ Reset UI ------------------
function resetUI() {
  if (deltaVal) deltaVal.innerText = "0%";
  if (thetaVal) thetaVal.innerText = "0%";
  if (alphaVal) alphaVal.innerText = "0%";
  if (betaVal) betaVal.innerText = "0%";
  if (gammaVal) gammaVal.innerText = "0%";
  if (sampleInfo) sampleInfo.innerText = "Value: —";
  if (deltaPercent) deltaPercent.innerText = "0%";
  if (thetaPercent) thetaPercent.innerText = "0%";
  if (alphaPercent) alphaPercent.innerText = "0%";
  if (betaPercent) betaPercent.innerText = "0%";
  if (gammaPercent) gammaPercent.innerText = "0%";
  if (deltaBar) deltaBar.style.width = "0%";
  if (thetaBar) thetaBar.style.width = "0%";
  if (alphaBar) alphaBar.style.width = "0%";
  if (betaBar) betaBar.style.width = "0%";
  if (gammaBar) gammaBar.style.width = "0%";
  if (dominantBandSpan) dominantBandSpan.innerText = "—";
  if (detectedStateParam) detectedStateParam.innerText = "Waiting…";
  if (dominantBandEl) dominantBandEl.innerText = "—";
  if (severityEl) severityEl.innerText = "—";
  if (mentalStateEl) mentalStateEl.innerText = "Waiting…";
  if (stressFill) stressFill.style.width = "0%";
  if (stressVal) stressVal.innerText = "0";
  if (attnFill) attnFill.style.width = "0%";
  if (attnVal) attnVal.innerText = "0";
  if (analysisUpdated) analysisUpdated.innerText = "Updated: —";
  if (noiseFill) noiseFill.style.width = "0%";
  if (noiseValue) noiseValue.innerText = "0%";
  if (window.resetMergedWaveform) window.resetMergedWaveform();
  if (window.resetMultiBandChart) window.resetMultiBandChart();
  if (brainIcon) brainIcon.style.color = "var(--accent)";
  bandHistory = [];
  rawSignalHistory = [];
  dataReceived = false;
}

// ------------------ WebSocket ------------------
function connectWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) return;
  // Close any existing socket before creating a new one
  if (socket) {
    socket.close();
    socket = null;
  }
  socket = new WebSocket(wsUrl);
  socket.onopen = () => {
    isConnected = true;
    reconnectAttempts = 0;
    if (connectionStatus) {
      connectionStatus.innerText = "Connected";
      connectionStatus.style.background = "rgba(34,197,94,0.15)";
      connectionStatus.style.color = "var(--good)";
    }
  };
  socket.onclose = () => {
    isConnected = false;
    if (connectionStatus) {
      connectionStatus.innerText = "No Server";
      connectionStatus.style.background = "";
      connectionStatus.style.color = "";
    }
    // Only reset UI if we are in live mode (not simulated)
    if (!useSimulated) {
      if (wsUrlBox) wsUrlBox.innerText = "No device connected";
      resetUI();
    }
    if (!useSimulated && reconnectAttempts < maxReconnect) {
      reconnectAttempts++;
      setTimeout(connectWebSocket, 2000 * reconnectAttempts);
    }
  };
  socket.onmessage = (event) => {
    if (useSimulated) return; // ignore messages if in simulated mode
    const data = JSON.parse(event.data);
    if (data.type === "comPort") {
      if (wsUrlBox)
        wsUrlBox.innerText = data.port
          ? `Device on ${data.port}`
          : "No device connected";
      return;
    }
    dataReceived = true;
    window.__EEG_STATE__.isConnected = true;
    handleIncomingData(data);
  };
}

// ------------------ Noise Calculation ------------------
let smoothedNoisePct = 0; // for exponential smoothing
function updateNoise(sample) {
  rawSignalHistory.push(sample);
  if (rawSignalHistory.length > 100) rawSignalHistory.shift(); // larger window for stability
  if (rawSignalHistory.length < 20) return; // need enough samples
  const mean =
    rawSignalHistory.reduce((a, b) => a + b, 0) / rawSignalHistory.length;
  const variance =
    rawSignalHistory.reduce((acc, val) => acc + (val - mean) ** 2, 0) /
    rawSignalHistory.length;
  const stdDev = Math.sqrt(variance);
  // Raw ADC range 0-1023, typical signal variation up to ~200 counts
  const maxNoise = 200;
  let rawNoisePct = Math.min(100, (stdDev / maxNoise) * 100);
  // Exponential smoothing: blend current reading with previous (0.3 = slow, smooth movement)
  smoothedNoisePct = smoothedNoisePct * 0.7 + rawNoisePct * 0.3;
  if (noiseFill) noiseFill.style.width = smoothedNoisePct + "%";
  if (noiseValue) noiseValue.innerText = Math.round(smoothedNoisePct) + "%";
}

// ------------------ Data Handling ------------------
function handleIncomingData(data) {
  if (data.type === "raw") {
    if (sampleInfo) sampleInfo.innerText = `Value: ${data.sample.toFixed(2)}`;
    if (window.updateMergedWaveform) window.updateMergedWaveform(data.sample);
    updateNoise(data.sample);
  } else if (data.type === "eeg") {
    const b = data.bands;
    const total =
      parseFloat(b.delta) +
      parseFloat(b.theta) +
      parseFloat(b.alpha) +
      parseFloat(b.beta) +
      parseFloat(b.gamma);
    if (total > 0) {
      const deltaPct = ((parseFloat(b.delta) / total) * 100).toFixed(1);
      const thetaPct = ((parseFloat(b.theta) / total) * 100).toFixed(1);
      const alphaPct = ((parseFloat(b.alpha) / total) * 100).toFixed(1);
      const betaPct = ((parseFloat(b.beta) / total) * 100).toFixed(1);
      const gammaPct = ((parseFloat(b.gamma) / total) * 100).toFixed(1);

      // Update brainwave signature (radar + list) with raw band %
      if (data.params) {
        const p = data.params;
        if (window.updateRadarChart) {
          window.updateRadarChart([
            p.stress,
            p.fatigue,
            p.lowEnergy,
            p.brainOverload,
            p.relaxation,
          ]);
        }
      } else {
        // Fallback: use band percentages as rough proxy (for demo purposes)
        if (window.updateRadarChart) {
          window.updateRadarChart([
            deltaPct,
            thetaPct,
            alphaPct,
            betaPct,
            gammaPct,
          ]);
        }
      }

      if (deltaVal) deltaVal.innerText = deltaPct + "%";
      if (thetaVal) thetaVal.innerText = thetaPct + "%";
      if (alphaVal) alphaVal.innerText = alphaPct + "%";
      if (betaVal) betaVal.innerText = betaPct + "%";
      if (gammaVal) gammaVal.innerText = gammaPct + "%";

      // Update parameter cards with mental state params
      if (data.params) {
        updateBrainStateParamsFromServer(data.params);
      }

      if (window.updateMultiBandChart) {
        window.updateMultiBandChart(
          deltaPct,
          thetaPct,
          alphaPct,
          betaPct,
          gammaPct,
        );
      }

      bandHistory.push({
        delta: parseFloat(b.delta),
        theta: parseFloat(b.theta),
        alpha: parseFloat(b.alpha),
        beta: parseFloat(b.beta),
        gamma: parseFloat(b.gamma),
      });

      updateMentalState(b, total);

      if (data.signalQuality) {
        updateSignalQualityUI(data.signalQuality);
      }

      if (data.state) {
        setBrainColor(data.state);
        if (diagnosticText)
          diagnosticText.innerHTML = `<strong>Detected: ${data.state}</strong> (real-time)`;
        if (detectedStateParam) detectedStateParam.innerText = data.state;
        if (mentalStateEl) mentalStateEl.innerText = data.state;
        if (analysisUpdated)
          analysisUpdated.innerText = `Updated: ${new Date().toLocaleTimeString()}`;
        // Update global state for chatbot
        window.__EEG_STATE__.state = data.state;
        window.__EEG_STATE__.bands = data.bands;
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
  if (stressFill) stressFill.style.width = stressPercent + "%";
  if (stressVal) stressVal.innerText = Math.round(stressPercent);

  let attention = ((beta + gamma) / total) * 100;
  if (attnFill) attnFill.style.width = attention + "%";
  if (attnVal) attnVal.innerText = Math.round(attention);

  let severity = "Low";
  if (stressPercent > 70) severity = "High";
  else if (stressPercent > 30) severity = "Medium";
  if (severityEl) {
    severityEl.innerText = severity;
    severityEl.className = `badge ${severity.toLowerCase()}`;
  }
}

// ------------------ Highlight Dominant Parameter ------------------
function highlightDominantParam(params) {
  Object.values(paramCards).forEach((el) => el?.classList.remove("dominant"));
  const dominant = params.dominant || "stress";
  if (paramCards[dominant]) paramCards[dominant].classList.add("dominant");
  const nameMap = {
    stress: "STRESS",
    fatigue: "FATIGUE",
    lowEnergy: "LOW ENERGY",
    brainOverload: "BRAIN OVERLOAD",
    relaxation: "RELAXATION",
  };
  return nameMap[dominant] || dominant.toUpperCase();
}

function setBrainColor(state) {
  if (!brainIcon) return;
  const colors = {
    Anxiety: "#C87D87", // Antique Rose
    Fatigue: "#E5BCA9", // Bisque
    Distraction: "#F0C4CB", // Blush
    Stress: "#ba5d6a", // Darkened Rose
    Relaxed: "#6B7556", // Dried Thyme
    Focused: "#8A9A5B", // Lighter Thyme
    Neutral: "var(--accent)",
  };
  brainIcon.style.color = colors[state] || "var(--accent)";
}

// ------------------ Simulated Data ------------------
function startSimulatedData() {
  if (wsUrlBox) wsUrlBox.innerText = "Simulated mode";
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(() => {
    const delta = (1 + Math.random() * 0.5).toFixed(2);
    const theta = (0.8 + Math.random() * 0.4).toFixed(2);
    const alpha = (0.6 + Math.random() * 0.6).toFixed(2);
    const beta = (0.4 + Math.random() * 0.5).toFixed(2);
    const gamma = (0.2 + Math.random() * 0.3).toFixed(2);
    const total =
      parseFloat(delta) +
      parseFloat(theta) +
      parseFloat(alpha) +
      parseFloat(beta) +
      parseFloat(gamma);
    const deltaPct = ((parseFloat(delta) / total) * 100).toFixed(0);
    const thetaPct = ((parseFloat(theta) / total) * 100).toFixed(0);
    const alphaPct = ((parseFloat(alpha) / total) * 100).toFixed(0);
    const betaPct = ((parseFloat(beta) / total) * 100).toFixed(0);
    const gammaPct = ((parseFloat(gamma) / total) * 100).toFixed(0);

    if (deltaVal) deltaVal.innerText = deltaPct + "%";
    if (thetaVal) thetaVal.innerText = thetaPct + "%";
    if (alphaVal) alphaVal.innerText = alphaPct + "%";
    if (betaVal) betaVal.innerText = betaPct + "%";
    if (gammaVal) gammaVal.innerText = gammaPct + "%";

    const avg =
      (parseFloat(delta) +
        parseFloat(theta) +
        parseFloat(alpha) +
        parseFloat(beta) +
        parseFloat(gamma)) /
      5;
    if (window.updateMergedWaveform) window.updateMergedWaveform(avg);
    updateNoise(avg * 200 + Math.random() * 50);

    const bands = { delta, theta, alpha, beta, gamma };
    if (window.updateMultiBandChart)
      window.updateMultiBandChart(
        deltaPct,
        thetaPct,
        alphaPct,
        betaPct,
        gammaPct,
      );

    // Simulate mental state params
    const simParams = simulateMentalStateParams(bands);
    updateBrainStateParamsFromServer(simParams);

    // 🔽 Update radar chart with the same params
    if (window.updateRadarChart) {
      window.updateRadarChart([
        simParams.stress,
        simParams.fatigue,
        simParams.lowEnergy,
        simParams.brainOverload,
        simParams.relaxation,
      ]);
    }

    updateMentalState(bands, total);

    const nameMap = {
      stress: "Stress",
      fatigue: "Fatigue",
      lowEnergy: "Low Energy",
      brainOverload: "Brain Overload",
      relaxation: "Relaxation",
    };
    const simState = nameMap[simParams.dominant] || "Neutral";
    setBrainColor(simState);
    if (diagnosticText)
      diagnosticText.innerHTML = `<strong>Simulated: ${simState}</strong> (demo)`;
    if (mentalStateEl) mentalStateEl.innerText = simState;
    if (analysisUpdated)
      analysisUpdated.innerText = `Updated: ${new Date().toLocaleTimeString()}`;
    updateSignalQualityUI("GREAT");
  }, 300);
}
function stopSimulatedData() {
  clearInterval(simInterval);
}

// Simulate mental state params for demo mode (mirrors backend logic)
function simulateMentalStateParams(bands) {
  const d = parseFloat(bands.delta) || 0;
  const t = parseFloat(bands.theta) || 0;
  const a = parseFloat(bands.alpha) || 0;
  const b = parseFloat(bands.beta) || 0;
  const g = parseFloat(bands.gamma) || 0;
  function sig(x, c, s) {
    return 100 / (1 + Math.exp(-s * (x - c)));
  }
  let stress = sig((b + g) / (a + 0.01), 1.8, 1.5);
  let fatigue = sig(t / (b + 0.01), 2.0, 1.2);
  let lowEnergy = sig((t + d) / (b + g + 0.01), 2.5, 1.0);
  let brainOverload = sig((b + g + t) / (a + 0.01), 3.5, 0.8);
  let relaxation = sig(a / (b + 0.01), 1.5, 1.8);
  if (stress > 65 && relaxation > 50) relaxation *= 0.5;
  if (relaxation > 65 && stress > 50) stress *= 0.5;
  if (brainOverload > 70 && fatigue > 60) fatigue *= 0.6;
  const rawTotal = stress + fatigue + lowEnergy + brainOverload + relaxation;
  if (rawTotal > 0) {
    stress = (stress / rawTotal) * 100;
    fatigue = (fatigue / rawTotal) * 100;
    lowEnergy = (lowEnergy / rawTotal) * 100;
    brainOverload = (brainOverload / rawTotal) * 100;
    relaxation = (relaxation / rawTotal) * 100;
  }
  const params = { stress, fatigue, lowEnergy, brainOverload, relaxation };
  const dominant = Object.keys(params).reduce((a, b) =>
    params[a] > params[b] ? a : b,
  );
  return {
    stress: Math.round(stress),
    fatigue: Math.round(fatigue),
    lowEnergy: Math.round(lowEnergy),
    brainOverload: Math.round(brainOverload),
    relaxation: Math.round(relaxation),
    dominant,
  };
}

// Update parameter cards from server params object
function updateBrainStateParamsFromServer(params) {
  if (!params) return;
  if (deltaPercent) deltaPercent.innerText = params.stress + "%";
  if (thetaPercent) thetaPercent.innerText = params.fatigue + "%";
  if (alphaPercent) alphaPercent.innerText = params.lowEnergy + "%";
  if (betaPercent) betaPercent.innerText = params.brainOverload + "%";
  if (gammaPercent) gammaPercent.innerText = params.relaxation + "%";
  if (deltaBar) deltaBar.style.width = params.stress + "%";
  if (thetaBar) thetaBar.style.width = params.fatigue + "%";
  if (alphaBar) alphaBar.style.width = params.lowEnergy + "%";
  if (betaBar) betaBar.style.width = params.brainOverload + "%";
  if (gammaBar) gammaBar.style.width = params.relaxation + "%";
  const dominant = highlightDominantParam(params);
  if (dominantBandSpan) dominantBandSpan.innerText = dominant;
  const nameMap = {
    stress: "Stress",
    fatigue: "Fatigue",
    lowEnergy: "Low Energy",
    brainOverload: "Brain Overload",
    relaxation: "Relaxation",
  };
  if (detectedStateParam)
    detectedStateParam.innerText = nameMap[params.dominant] || "Analyzing…";
}

// ------------------ Timer ------------------
function startTimer() {
  secondsElapsed = 0;
  if (timerDisplay) timerDisplay.innerText = formatTime(0);
  timerInterval = setInterval(() => {
    secondsElapsed++;
    if (timerDisplay) timerDisplay.innerText = formatTime(secondsElapsed);
    if (mainAction) {
      mainAction.innerText = secondsElapsed >= 30 ? "Stop & Analyze" : "Stop";
      mainAction.classList.toggle("ready", secondsElapsed >= 30);
    }
  }, 1000);
}
function stopTimer() {
  clearInterval(timerInterval);
  secondsElapsed = 0;
  if (timerDisplay) timerDisplay.innerText = "00:00";
}
function formatTime(sec) {
  return `${Math.floor(sec / 60)
    .toString()
    .padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
}

// ------------------ Analysis ------------------
// Remedy mapping for the 5 new parameters
const PARAM_REMEDY_MAP = {
  stress: {
    label: "Stress",
    remedy: "Audio Therapy",
    page: "solutions.html?condition=stress",
  },
  fatigue: {
    label: "Fatigue",
    remedy: "Visual Therapy",
    page: "solutions.html?condition=fatigue",
  },
  lowEnergy: {
    label: "Low Energy",
    remedy: "Physical Activity",
    page: "solutions.html?condition=low-energy",
  },
  brainOverload: {
    label: "Brain Overload",
    remedy: "Visual Therapy",
    page: "solutions.html?condition=brain-overload",
  },
  relaxation: {
    label: "Relaxation",
    remedy: "Lifestyle Suggestions",
    page: "solutions.html?condition=relaxation",
  },
};

function performAnalysis(duration) {
  const loading = document.getElementById("loadingOverlay");
  if (loading) loading.style.display = "flex";
  setTimeout(() => {
    if (loading) loading.style.display = "none";

    // Average all collected band readings over the session
    if (bandHistory.length === 0) {
      showResult("Relaxation", duration, {
        stress: 10,
        fatigue: 10,
        lowEnergy: 15,
        brainOverload: 5,
        relaxation: 60,
        dominant: "relaxation",
      });
      return;
    }
    const avg = bandHistory.reduce(
      (acc, cur) => {
        acc.delta += cur.delta;
        acc.theta += cur.theta;
        acc.alpha += cur.alpha;
        acc.beta += cur.beta;
        acc.gamma += cur.gamma;
        return acc;
      },
      { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
    );
    const count = bandHistory.length;
    avg.delta /= count;
    avg.theta /= count;
    avg.alpha /= count;
    avg.beta /= count;
    avg.gamma /= count;

    // Use the same 5-parameter math from the Brain State Parameters section
    const params = simulateMentalStateParams(avg);
    const dominant = params.dominant; // e.g. 'stress', 'fatigue', etc.
    const dominantLabel = PARAM_REMEDY_MAP[dominant]?.label || "Relaxation";

    showResult(dominantLabel, duration, params);
  }, 1000);
}

// ------------------ Show Result ------------------
function showResult(condition, duration, params) {
  if (overlayCondition) overlayCondition.innerText = condition;

  // Build the 5-parameter breakdown for the popup
  let paramBreakdown = "";
  if (params) {
    const dominantKey = params.dominant || "relaxation";
    const info = PARAM_REMEDY_MAP[dominantKey];
    paramBreakdown = `
            <div style="margin: 1rem 0; text-align: left;">
                <div style="font-weight: 600; margin-bottom: 0.8rem; font-size: 1.05rem;">Session Breakdown:</div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${Object.entries(PARAM_REMEDY_MAP)
                      .map(([key, val]) => {
                        const pct = params[key] || 0;
                        const isDominant = key === dominantKey;
                        return `<div style="display: flex; align-items: center; gap: 0.8rem; padding: 0.4rem 0.6rem; border-radius: 0.8rem; ${isDominant ? "background: rgba(47,125,143,0.15); border: 1px solid var(--accent);" : ""}"> 
                            <span style="min-width: 110px; font-weight: ${isDominant ? "700" : "400"}; font-size: 0.9rem;">${val.label}</span>
                            <div style="flex: 1; height: 8px; background: rgba(148,163,184,0.2); border-radius: 4px; overflow: hidden;"><div style="width: ${pct}%; height: 100%; background: ${isDominant ? "var(--accent)" : "rgba(148,163,184,0.4)"}; border-radius: 4px; transition: width 0.5s;"></div></div>
                            <span style="min-width: 36px; text-align: right; font-weight: ${isDominant ? "700" : "400"}; font-size: 0.9rem;">${Math.round(pct)}%</span>
                        </div>`;
                      })
                      .join("")}
                </div>
            </div>
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(47,125,143,0.1); border-radius: 1rem; border-left: 4px solid var(--accent);">
                <div style="font-weight: 600; margin-bottom: 0.3rem;">Recommended: ${info?.remedy || "Lifestyle Suggestions"}</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">${getParamSolution(dominantKey)}</div>
            </div>
        `;
  }

  if (solutionsContent) solutionsContent.innerHTML = paramBreakdown;
  if (overlay) overlay.style.display = "block";

  // Update the Mental State Detection card below the popup
  const dominantKey = params?.dominant || "relaxation";
  const info = PARAM_REMEDY_MAP[dominantKey];
  if (diagnosticText)
    diagnosticText.innerHTML = `<strong>Detected: ${condition}</strong> · ${info?.remedy || "Lifestyle Suggestions"} recommended · based on ${duration || 30}s analysis.`;
  if (diagnosticSolutionsBtn) {
    diagnosticSolutionsBtn.style.display = "inline-block";
    diagnosticSolutionsBtn.onclick = () =>
      (window.location.href = info?.page || "solutions.html?condition=stress");
  }

  const timestamp = new Date().toLocaleTimeString();
  const session = {
    time: timestamp,
    condition: condition,
    duration: duration || 30,
    bands: {
      delta: deltaVal?.innerText || "0%",
      theta: thetaVal?.innerText || "0%",
      alpha: alphaVal?.innerText || "0%",
      beta: betaVal?.innerText || "0%",
      gamma: gammaVal?.innerText || "0%",
    },
  };
  recentSessions.unshift(session);
  if (recentSessions.length > 5) recentSessions.pop();
  updateRecentList();

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "saveSession",
        condition: condition,
        bands: session.bands,
        duration: duration || 30,
      }),
    );
  }
  recentSessions.unshift(session);
  if (recentSessions.length > 10) recentSessions.pop(); // keep last 10
  localStorage.setItem("eeg_recent_sessions", JSON.stringify(recentSessions));
  updateRecentList();
}

// ------------------ Update Recent List ------------------
function updateRecentList() {
  if (!recentListEl) return;
  recentListEl.innerHTML = "";
  if (recentSessions.length === 0) {
    recentListEl.innerHTML =
      '<li style="color:var(--text-muted);">No sessions yet</li>';
    return;
  }
  recentSessions.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="condition">${s.condition}</span> <span class="time">${s.time}</span>`;
    li.addEventListener("click", () => {
      if (overlayCondition) overlayCondition.innerText = s.condition;
      if (solutionsContent)
        solutionsContent.innerHTML =
          getSolutions(s.condition) +
          `<br><small>Session at ${s.time} (${s.duration}s)</small>`;
      if (overlay) overlay.style.display = "block";
    });
    recentListEl.appendChild(li);
  });
}

// ------------------ Solutions Map ------------------
// Specific remedies for the 5 new parameters
function getParamSolution(paramKey) {
  const map = {
    stress:
      "Your brain is showing elevated stress. Try Audio Therapy — calming music, binaural beats, or guided breathing exercises to reduce cortisol levels.",
    fatigue:
      "Your brain is tired. Try Visual Therapy — nature scenes, guided imagery, or relaxing visual patterns to restore mental energy.",
    lowEnergy:
      "Your energy is low. Try Physical Activity — light stretching, a short walk, or neck/shoulder exercises to boost alertness.",
    brainOverload:
      "Your brain is overloaded with activity. Try Visual Therapy — slow-moving visuals, mandala coloring, or eye-rest exercises to calm neural activity.",
    relaxation:
      "You are in a relaxed state! Lifestyle Suggestions — maintain this with good sleep, hydration, and mindfulness practices.",
  };
  return map[paramKey] || "Stay mindful and balanced.";
}

// Keep old solutions for the Recommendations section (backward compatibility)
function getSolutions(condition) {
  const map = {
    Stress:
      "Deep breathing: inhale 4s, hold 4s, exhale 6s. Consider a short walk.",
    Anxiety: "5-4-3-2-1 grounding technique.",
    Fatigue: "Power nap (10-20 min) or hydrate.",
    Distraction: "Pomodoro: 25 min focus, 5 min break.",
    "Mild Depression": "Reach out to a friend or professional.",
    Focused: "Great! Keep it up with short breaks.",
    Relaxed: "Enjoy this state; consider meditation.",
    Neutral: "Your brain is balanced. Continue.",
    Daydreaming: "Light focus exercise or walk.",
  };
  return map[condition] || "Stay mindful.";
}

// ------------------ Toast ------------------
function showError(msg, type = "error") {
  const toast = document.createElement("div");
  toast.className = `error-toast ${type}`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
function showToast(msg) {
  showError(msg, "success");
}

// ------------------ Event Listeners ------------------
if (liveBtn) {
    liveBtn.addEventListener('click', () => {
        if (monitoring) return;
        liveBtn.classList.add('active');
        simBtn.classList.remove('active');
        useSimulated = false;
        // Show the socket details element
        if (wsUrlBox) wsUrlBox.style.display = '';      // or 'inline-block' if needed
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectWebSocket();
        }
        if (wsUrlBox) wsUrlBox.innerText = isConnected ? 'Connected' : 'No device connected';
        resetUI();
    });
}
if (simBtn) {
    simBtn.addEventListener('click', () => {
        if (monitoring) return;
        simBtn.classList.add('active');
        liveBtn.classList.remove('active');
        useSimulated = true;
        if (socket) {
            socket.close();
            socket = null;
        }
        if (wsUrlBox) wsUrlBox.innerText = 'Simulated mode';
        resetUI();
    });
}
if (mainAction) {
  mainAction.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!monitoring) {
      if (!useSimulated && !isConnected) {
        showError("❌ No device connected. Use simulated or connect.", "error");
        return;
      }
      monitoring = true;
      dataReceived = false;
      bandHistory = [];
      rawSignalHistory = [];
      if (liveBtn) liveBtn.disabled = true;
      if (simBtn) simBtn.disabled = true;
      startTimer();
      if (canvas) {
        canvas.style.border = "3px solid #6b8e4c";
        canvas.style.boxShadow = "0 0 15px #6b8e4c";
      }

      // Start simulated data if in simulated mode
      if (useSimulated) {
        startSimulatedData();
      }
    } else {
      document.getElementById("confirmOverlay").style.display = "block";
    }
  });
}
document.getElementById("cancelStopBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("confirmOverlay").style.display = "none";
});
document.getElementById("confirmStopBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("confirmOverlay").style.display = "none";
  executeStopMonitoring();
});
function executeStopMonitoring() {
  monitoring = false;
  const timeAtStop = secondsElapsed;
  stopTimer();
  stopSimulatedData();
  if (liveBtn) liveBtn.disabled = false;
  if (simBtn) simBtn.disabled = false;
  mainAction.innerText = "Start Monitoring";
  if (canvas) {
    canvas.style.border = "none";
    canvas.style.boxShadow = "none";
  }
  if (!useSimulated && !dataReceived) {
    showError("⚠️ No data received. Check connection.", "error");
    return;
  }
  if (timeAtStop >= 30) performAnalysis(timeAtStop);
  else showError("Session too short (need 30s).", "warning");
}

document
  .getElementById("viewSolutionsOverlayBtn")
  ?.addEventListener("click", () => {
    const cond = overlayCondition?.innerText.toLowerCase() || "stress";
    window.location.href = `solutions.html?condition=${cond}`;
  });
if (overlay) overlay.addEventListener("click", (e) => e.stopPropagation());

window.selectMentalState = function (state, el) {
  document
    .querySelectorAll(".mental-state-card")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  const recs = document.getElementById("recs");
  if (recs) recs.innerHTML = `<li>${getSolutions(state)}</li>`;
};
window.viewRemediesForState = function () {
  const active = document.querySelector(".mental-state-card.active");
  if (active)
    window.location.href = `solutions.html?condition=${active.getAttribute("data-state").toLowerCase()}`;
  else showError("Select a condition first.", "warning");
};

function updateSignalQualityUI(quality) {
  if (!signalQualityBadge) return;
  signalQualityBadge.innerText = quality;
  signalQualityBadge.className = "pill q-" + quality.toLowerCase();
}

// Start WebSocket only if not in simulated mode (default to live)
if (!useSimulated) {
  connectWebSocket();
}
