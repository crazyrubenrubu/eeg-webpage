const fft = require('fft-js').fft;
const fftUtil = require('fft-js').fftUtil;

function processEEG(samples, sampleRate) {
  // Apply a simple Hanning window
  const windowed = samples.map((s, i) => s * (0.5 * (1 - Math.cos(2 * Math.PI * i / (samples.length - 1)))));
  
  // Perform FFT
  const phasors = fft(windowed);
  const magnitudes = fftUtil.fftMag(phasors); // array of length N/2+1
  
  const nyquist = sampleRate / 2;
  const binWidth = sampleRate / samples.length;
  
  // Define frequency bands (Hz)
  const bands = {
    delta: { min: 0.5, max: 4 },
    theta: { min: 4, max: 8 },
    alpha: { min: 8, max: 13 },
    beta:  { min: 13, max: 30 },
    gamma: { min: 30, max: 45 }
  };

  let result = {};
  for (let band in bands) {
    let minBin = Math.floor(bands[band].min / binWidth);
    let maxBin = Math.ceil(bands[band].max / binWidth);
    // Ensure within array bounds
    minBin = Math.max(1, Math.min(minBin, magnitudes.length-1));
    maxBin = Math.min(maxBin, magnitudes.length-1);
    let sum = 0;
    for (let i = minBin; i <= maxBin; i++) {
      sum += magnitudes[i];
    }
    result[band] = (sum / (maxBin - minBin + 1)).toFixed(2);
  }
  return result;
}

module.exports = { processEEG };