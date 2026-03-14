// chart.js – Multi‑band waveform with reset function
const ctx = document.getElementById('eegCanvas').getContext('2d');
const maxLength = 60;

const datasets = [
    { label: 'Delta', data: [], borderColor: '#1f77b4', backgroundColor: 'rgba(31,119,180,0.1)', pointRadius: 0, tension: 0.2, fill: false },
    { label: 'Theta', data: [], borderColor: '#ff7f0e', backgroundColor: 'rgba(255,127,14,0.1)', pointRadius: 0, tension: 0.2, fill: false },
    { label: 'Alpha', data: [], borderColor: '#2ca02c', backgroundColor: 'rgba(44,160,44,0.1)', pointRadius: 0, tension: 0.2, fill: false },
    { label: 'Beta',  data: [], borderColor: '#d62728', backgroundColor: 'rgba(214,39,40,0.1)', pointRadius: 0, tension: 0.2, fill: false },
    { label: 'Gamma', data: [], borderColor: '#9467bd', backgroundColor: 'rgba(148,103,189,0.1)', pointRadius: 0, tension: 0.2, fill: false }
];

// Fill with zeros
for (let i = 0; i < maxLength; i++) {
    datasets.forEach(ds => ds.data.push(0));
}

const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: Array(maxLength).fill(''), datasets },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: { display: false },
            y: { beginAtZero: true, grid: { color: '#cde3ea' }, suggestedMin: 0, suggestedMax: 10 }
        },
        plugins: { legend: { display: false } }
    }
});

// Update function
window.updateBandWaveforms = function(delta, theta, alpha, beta, gamma) {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(delta);
    chart.data.datasets[1].data.shift();
    chart.data.datasets[1].data.push(theta);
    chart.data.datasets[2].data.shift();
    chart.data.datasets[2].data.push(alpha);
    chart.data.datasets[3].data.shift();
    chart.data.datasets[3].data.push(beta);
    chart.data.datasets[4].data.shift();
    chart.data.datasets[4].data.push(gamma);
    chart.update();
};

// Reset function (fill all datasets with zeros)
window.resetBandWaveforms = function() {
    for (let i = 0; i < maxLength; i++) {
        chart.data.datasets.forEach(ds => ds.data[i] = 0);
    }
    chart.update();
};