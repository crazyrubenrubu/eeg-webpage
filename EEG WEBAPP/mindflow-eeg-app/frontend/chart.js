// chart.js
const ctx = document.getElementById('eegCanvas').getContext('2d');
const maxLength = 100; // number of points shown
let labels = [];
let dataPoints = [];

for (let i = 0; i < maxLength; i++) {
    labels.push(i);
    dataPoints.push(0);
}

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'EEG (µV)',
            data: dataPoints,
            borderColor: '#2f7d8f',
            backgroundColor: 'rgba(47,125,143,0.1)',
            tension: 0.2,
            pointRadius: 0,
            borderWidth: 2,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: { display: false },
            y: { beginAtZero: true, grid: { color: '#cde3ea' } }
        },
        plugins: { legend: { display: false } }
    }
});

// Function to push new sample and shift
window.updateWaveform = function(newSample) {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(newSample);
    chart.update();
};