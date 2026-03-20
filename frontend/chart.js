// chart.js – Optimized for smooth performance and no crashes
let eegChart = null;
let multiBandChart = null;
let bwRadarChart = null;                // <-- ADDED
let pendingRadarUpdate = false;         // <-- ADDED
const MAX_DATA_POINTS = 100;
const MAX_HISTORY = 40;

// Flags for requestAnimationFrame batching
let pendingEegUpdate = false;
let pendingMultiUpdate = false;

function getChartColors() {
    return document.body.classList.contains('dark-mode')
        ? ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
        : ['#b91c1c', '#d97706', '#059669', '#2563eb', '#7c3aed'];
}

function initEegChart() {
    const ctx = document.getElementById('eegCanvas');
    if (!ctx) return;
    if (eegChart) eegChart.destroy();

    eegChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [{
                label: 'Amplitude',
                data: Array(MAX_DATA_POINTS).fill(0),
                borderColor: '#3e93a8',
                backgroundColor: 'rgba(62,147,168,0.15)',
                borderWidth: 2.5,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                y: {
                    min: 0,
                    max: 1,        // adjust to your signal range
                    ticks: { display: false },
                    grid: { display: false }
                },
                x: {
                    ticks: { display: false },
                    grid: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function initMultiBandChart() {
    const ctx = document.getElementById('dominantChart');
    if (!ctx) return;
    if (multiBandChart) multiBandChart.destroy();

    const colors = getChartColors();
    const textColor = document.body.classList.contains('dark-mode') ? '#fff' : '#000';

    multiBandChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: Array(MAX_HISTORY).fill(''),
            datasets: [
                { label: 'Delta', data: [], borderColor: colors[0], backgroundColor: 'transparent', pointBackgroundColor: colors[0], pointBorderColor: colors[0], tension: 0.4, pointRadius: 0 },
                { label: 'Theta', data: [], borderColor: colors[1], backgroundColor: 'transparent', pointBackgroundColor: colors[1], pointBorderColor: colors[1], tension: 0.4, pointRadius: 0 },
                { label: 'Alpha', data: [], borderColor: colors[2], backgroundColor: 'transparent', pointBackgroundColor: colors[2], pointBorderColor: colors[2], tension: 0.4, pointRadius: 0 },
                { label: 'Beta',  data: [], borderColor: colors[3], backgroundColor: 'transparent', pointBackgroundColor: colors[3], pointBorderColor: colors[3], tension: 0.4, pointRadius: 0 },
                { label: 'Gamma', data: [], borderColor: colors[4], backgroundColor: 'transparent', pointBackgroundColor: colors[4], pointBorderColor: colors[4], tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(148,163,184,0.15)' }
                },
                x: {
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'rect',
                        boxWidth: 12,
                        boxHeight: 12,
                        color: textColor
                    }
                }
            }
        }
    });
}

// ========== RADAR CHART FUNCTIONS ==========
window.setRadarChart = function(chart) {
    bwRadarChart = chart;
};

window.updateRadarChart = function(data) {
    if (!bwRadarChart) return;
    if (!pendingRadarUpdate) {
        pendingRadarUpdate = true;
        requestAnimationFrame(() => {
            if (bwRadarChart) {
                bwRadarChart.data.datasets[0].data = data;
                bwRadarChart.update({ duration: 0 });
            }
            pendingRadarUpdate = false;
        });
    }
};

window.updateMergedWaveform = function(sample) {
    if (!eegChart) return;
    const value = parseFloat(sample);
    if (isNaN(value)) return;

    const dataArr = eegChart.data.datasets[0].data;
    dataArr.push(value);
    if (dataArr.length > MAX_DATA_POINTS) dataArr.shift();

    if (!pendingEegUpdate) {
        pendingEegUpdate = true;
        requestAnimationFrame(() => {
            if (eegChart) {
                eegChart.update({ duration: 0 });
            }
            pendingEegUpdate = false;
        });
    }
};

window.updateMultiBandChart = function(delta, theta, alpha, beta, gamma) {
    if (!multiBandChart) return;

    const toNum = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);
    const datasets = multiBandChart.data.datasets;

    datasets[0].data.push(toNum(delta));
    datasets[1].data.push(toNum(theta));
    datasets[2].data.push(toNum(alpha));
    datasets[3].data.push(toNum(beta));
    datasets[4].data.push(toNum(gamma));

    if (datasets[0].data.length > MAX_HISTORY) {
        datasets.forEach(ds => ds.data.shift());
    }

    if (!pendingMultiUpdate) {
        pendingMultiUpdate = true;
        requestAnimationFrame(() => {
            if (multiBandChart) {
                multiBandChart.update({ duration: 0 });
            }
            pendingMultiUpdate = false;
        });
    }
};

window.resetMergedWaveform = function() {
    if (eegChart) {
        eegChart.data.datasets[0].data = Array(MAX_DATA_POINTS).fill(0);
        eegChart.update({ duration: 0 });
    }
};

window.resetMultiBandChart = function() {
    if (multiBandChart) {
        multiBandChart.data.datasets.forEach(ds => ds.data = []);
        multiBandChart.update({ duration: 0 });
    }
};

// Update chart colors and legend text on theme change
const observer = new MutationObserver(() => {
    if (multiBandChart) {
        const colors = getChartColors();
        multiBandChart.data.datasets.forEach((ds, i) => {
            ds.borderColor = colors[i];
            ds.pointBackgroundColor = colors[i];
            ds.pointBorderColor = colors[i];
        });

        const newTextColor = document.body.classList.contains('dark-mode') ? '#fff' : '#000';
        if (multiBandChart.config.options.plugins.legend.labels) {
            multiBandChart.config.options.plugins.legend.labels.color = newTextColor;
        }

        multiBandChart.update({ duration: 0 });
    }
});
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

document.addEventListener('DOMContentLoaded', () => {
    initEegChart();
    initMultiBandChart();
});