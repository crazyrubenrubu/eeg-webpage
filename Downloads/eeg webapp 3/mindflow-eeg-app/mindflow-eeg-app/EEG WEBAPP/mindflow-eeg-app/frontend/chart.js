// chart.js – Merged waveform and multi‑band history chart (with theme‑aware legend)
let eegChart = null;
let multiBandChart = null;
const MAX_DATA_POINTS = 100;
const MAX_HISTORY = 40;

function getChartColors() {
    return document.body.classList.contains('dark-mode')
        ? ['#7c3aed', '#9333ea', '#a855f7', '#c084fc', '#e9d5ff']
        : ['#2f7d8f', '#459ba4', '#70b7bf', '#99d3d9', '#c2eff3'];
}

function initEegChart() {
    const ctx = document.getElementById('eegCanvas');
    if (!ctx) return;
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
            animation: { duration: 0 },
            scales: { y: { ticks: { display: false } }, x: { ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function initMultiBandChart() {
    const ctx = document.getElementById('dominantChart');
    if (!ctx) return;
    const colors = getChartColors();
    multiBandChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: Array(MAX_HISTORY).fill(''),
            datasets: [
                { label: 'Delta', data: [], borderColor: colors[0], backgroundColor: 'transparent', tension: 0.4, pointRadius: 0 },
                { label: 'Theta', data: [], borderColor: colors[1], backgroundColor: 'transparent', tension: 0.4, pointRadius: 0 },
                { label: 'Alpha', data: [], borderColor: colors[2], backgroundColor: 'transparent', tension: 0.4, pointRadius: 0 },
                { label: 'Beta', data: [], borderColor: colors[3], backgroundColor: 'transparent', tension: 0.4, pointRadius: 0 },
                { label: 'Gamma', data: [], borderColor: colors[4], backgroundColor: 'transparent', tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(148,163,184,0.15)' } },
                x: { ticks: { display: false } }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: 'var(--text-primary)' } // theme-aware
                }
            }
        }
    });
}

window.updateMergedWaveform = function(sample) {
    if (!eegChart) return;
    const dataArr = eegChart.data.datasets[0].data;
    dataArr.push(sample);
    if (dataArr.length > MAX_DATA_POINTS) dataArr.shift();
    eegChart.update();
};

window.updateMultiBandChart = function(delta, theta, alpha, beta, gamma) {
    if (!multiBandChart) return;
    const datasets = multiBandChart.data.datasets;
    datasets[0].data.push(parseFloat(delta));
    datasets[1].data.push(parseFloat(theta));
    datasets[2].data.push(parseFloat(alpha));
    datasets[3].data.push(parseFloat(beta));
    datasets[4].data.push(parseFloat(gamma));
    if (datasets[0].data.length > MAX_HISTORY) {
        datasets.forEach(ds => ds.data.shift());
    }
    multiBandChart.update();
};

window.resetMergedWaveform = function() {
    if (eegChart) eegChart.data.datasets[0].data = Array(MAX_DATA_POINTS).fill(0);
    eegChart?.update();
};

window.resetMultiBandChart = function() {
    if (multiBandChart) {
        multiBandChart.data.datasets.forEach(ds => ds.data = []);
        multiBandChart.update();
    }
};

// Update chart colors on theme change
const observer = new MutationObserver(() => {
    if (multiBandChart) {
        const colors = getChartColors();
        multiBandChart.data.datasets.forEach((ds, i) => { ds.borderColor = colors[i]; });
        multiBandChart.update();
    }
});
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

document.addEventListener('DOMContentLoaded', () => {
    initEegChart();
    initMultiBandChart();
});