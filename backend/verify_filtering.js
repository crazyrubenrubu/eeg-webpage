const { processEEG } = require('./eegProcessor');

// Helper to generate a signal with a large DC offset and a sudden spike (blink)
function generateNoisySignal(length) {
    const signal = [];
    const baseline = 512; // Typical Arduino mid-point
    const drift = 100; // Large baseline drift
    
    for (let i = 0; i < length; i++) {
        // Sine wave (approx Alpha 10Hz) + DC Offset + Drift + Spike
        let val = baseline + drift + Math.sin(i * 0.25) * 50;
        
        // Add a massive spike in the middle (simulating a blink/muscle movement)
        if (i > 100 && i < 110) {
            val += 1000;
        }
        
        signal.push(val);
    }
    return signal;
}

const sampleRate = 100;
const noisySignal = generateNoisySignal(256);

console.log('--- Testing EEG Signal Filtering ---');
console.log('Original Sample Value (with offset/spike):', noisySignal[105]);

const results = processEEG(noisySignal, sampleRate);

console.log('\n--- Processed Band Results ---');
console.log('Delta:', results.delta);
console.log('Theta:', results.theta);
console.log('Alpha:', results.alpha);
console.log('Beta:', results.beta);
console.log('Gamma:', results.gamma);

if (results.delta < 5.0) {
    console.log('\n✅ SUCCESS: Delta levels are controlled despite large baseline drift and spikes.');
} else {
    console.log('\n❌ WARNING: Delta levels are still high. Further tuning may be needed.');
}

console.log('\nMetrics:');
console.log('Attention:', results.attention);
console.log('Meditation:', results.meditation);
