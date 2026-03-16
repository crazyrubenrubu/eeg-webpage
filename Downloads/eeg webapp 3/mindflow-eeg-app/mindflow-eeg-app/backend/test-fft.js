const { processEEG } = require('./eegProcessor');

// Generate some test data (sine wave)
const testData = [];
for (let i = 0; i < 256; i++) {
  testData.push(Math.sin(2 * Math.PI * 10 * i / 256) * 100 + 512);
}

// Process the test data
const result = processEEG(testData, 256);
console.log('EEG Processing Result:');
console.log('Bands:', {
  delta: result.delta.toFixed(2),
  theta: result.theta.toFixed(2),
  alpha: result.alpha.toFixed(2),
  beta: result.beta.toFixed(2),
  gamma: result.gamma.toFixed(2)
});
console.log('Attention:', result.attention);
console.log('Meditation:', result.meditation);