// chart.js – Renders the futuristic waveform and historical brainwave charts
let eegChart = null;
let dominantChart = null;

const MAX_DATA_POINTS = 100; // How many points to show on the live waveform
const MAX_DOMINANT_POINTS = 40; // How many points to show on the history chart

// Helper to map string bands to Y-axis numbers
const bandToNum = { 'DELTA': 1, 'THETA': 2, 'ALPHA': 3, 'BETA': 4, 'GAMMA': 5 };
const numToBand = { 1: 'DELTA', 2: 'THETA', 3: 'ALPHA', 4: 'BETA', 5: 'GAMMA' };

function initCharts() {
    // 1. Live EEG Waveform Chart
    const ctxEeg = document.getElementById('eegCanvas');
    if (ctxEeg) {
        eegChart = new Chart(ctxEeg.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(MAX_DATA_POINTS).fill(''),
                datasets: [{
                    label: 'Amplitude',
                    data: Array(MAX_DATA_POINTS).fill(0),
                    borderColor: '#3e93a8', // Accent light
                    backgroundColor: 'rgba(62, 147, 168, 0.15)', // Translucent fill
                    borderWidth: 2.5,
                    pointRadius: 0, // Hide points for a smooth continuous line
                    fill: true,
                    tension: 0.4 // Smooth bezier curves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Forces chart to fill CSS height
                animation: { duration: 0 }, // Disable native animation for smoother live-updating
                scales: {
                    y: {
                        grid: { color: 'rgba(148, 163, 184, 0.15)' },
                        ticks: { display: false } // Hide raw numbers for a cleaner look
                    },
                    x: {
                        grid: { display: false },
                        ticks: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    // 2. Dominant Brainwave Chart
    const ctxDom = document.getElementById('dominantChart');
    if (ctxDom) {
        dominantChart = new Chart(ctxDom.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(MAX_DOMINANT_POINTS).fill(''),
                datasets: [{
                    label: 'Dominant Band',
                    data: Array(MAX_DOMINANT_POINTS).fill(null),
                    borderColor: '#a855f7', // Purple accent
                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#a855f7',
                    pointRadius: 3,
                    stepped: true // Creates a digital/staircase look for states
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Forces chart to fill CSS height
                animation: { duration: 0 },
                scales: {
                    y: {
                        min: 0.5,
                        max: 5.5,
                        grid: { color: 'rgba(148, 163, 184, 0.15)' },
                        ticks: {
                            callback: function(value) {
                                return numToBand[value] || '';
                            },
                            font: { family: 'Inter', size: 10 },
                            color: '#56848f',
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { display: false }
                    }
                },
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Dominant: ${numToBand[context.raw]}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Global hooks called by dashboard.js when WebSocket data arrives
window.updateMergedWaveform = function(sample) {
    if (!eegChart) return;
    const dataArr = eegChart.data.datasets[0].data;
    dataArr.push(sample);
    if (dataArr.length > MAX_DATA_POINTS) dataArr.shift();
    eegChart.update();
};

window.updateDominantChart = function(dominantStr) {
    if (!dominantChart) return;
    const val = bandToNum[dominantStr.toUpperCase()] || null;
    const dataArr = dominantChart.data.datasets[0].data;
    dataArr.push(val);
    if (dataArr.length > MAX_DOMINANT_POINTS) dataArr.shift();
    dominantChart.update();
};

window.resetMergedWaveform = function() {
    if (!eegChart) return;
    eegChart.data.datasets[0].data = Array(MAX_DATA_POINTS).fill(0);
    eegChart.update();
};

window.resetDominantChart = function() {
    if (!dominantChart) return;
    dominantChart.data.datasets[0].data = Array(MAX_DOMINANT_POINTS).fill(null);
    dominantChart.update();
};

// Initialize charts when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initCharts);