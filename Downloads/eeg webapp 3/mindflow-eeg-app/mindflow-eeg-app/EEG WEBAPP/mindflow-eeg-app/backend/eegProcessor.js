const fft = require('fft-js');

// Scale factor to convert raw FFT magnitudes to microvolts
// Adjust this based on your hardware (ADC reference, gain, etc.)
const SCALE_FACTOR = 1000;

function processEEG(dataBuffer, sampleRate = 256) {
  // Make sure dataBuffer is an array of numbers
  if (!Array.isArray(dataBuffer)) {
    console.error('Data buffer is not an array');
    return null;
  }

  // Perform FFT - fft.fft returns an array of [real, imag] pairs
  const phasors = fft.fft(dataBuffer);
  
  // Calculate magnitudes manually
  const magnitudes = phasors.map(p => Math.sqrt(p[0] * p[0] + p[1] * p[1]));
  
  // Calculate band powers (raw, unscaled)
  const bands = calculateFrequencyBands(magnitudes, sampleRate, dataBuffer.length);
  
  // Calculate metrics using raw magnitudes (as originally designed)
  const attention = calculateAttention(bands);
  const meditation = calculateMeditation(bands);
  
  // Scale the band values for output (convert to microvolts)
  return {
    delta: Number((bands.delta / SCALE_FACTOR).toFixed(2)),
    theta: Number((bands.theta / SCALE_FACTOR).toFixed(2)),
    alpha: Number((bands.alpha / SCALE_FACTOR).toFixed(2)),
    beta: Number((bands.beta / SCALE_FACTOR).toFixed(2)),
    gamma: Number((bands.gamma / SCALE_FACTOR).toFixed(2)),
    attention: attention,
    meditation: meditation
  };
}

function calculateFrequencyBands(magnitudes, samplingRate, numSamples) {
  const nyquist = samplingRate / 2;
  const freqResolution = samplingRate / numSamples;
  
  let delta = 0, theta = 0, alpha = 0, beta = 0, gamma = 0;
  let deltaCount = 0, thetaCount = 0, alphaCount = 0, betaCount = 0, gammaCount = 0;
  
  // Skip DC component (index 0) for band calculation
  for (let i = 1; i < magnitudes.length; i++) {
    const frequency = i * freqResolution;
    
    if (frequency <= nyquist) {
      if (frequency >= 0.5 && frequency <= 4) {
        delta += magnitudes[i];
        deltaCount++;
      } else if (frequency > 4 && frequency <= 8) {
        theta += magnitudes[i];
        thetaCount++;
      } else if (frequency > 8 && frequency <= 13) {
        alpha += magnitudes[i];
        alphaCount++;
      } else if (frequency > 13 && frequency <= 30) {
        beta += magnitudes[i];
        betaCount++;
      } else if (frequency > 30 && frequency <= 50) {
        gamma += magnitudes[i];
        gammaCount++;
      }
    }
  }
  
  // Average the values
  return {
    delta: delta / (deltaCount || 1),
    theta: theta / (thetaCount || 1),
    alpha: alpha / (alphaCount || 1),
    beta: beta / (betaCount || 1),
    gamma: gamma / (gammaCount || 1)
  };
}

function calculateAttention(bands) {
  // Improved attention calculation
  // Attention is associated with beta and gamma, less with alpha and theta
  
  const total = bands.delta + bands.theta + bands.alpha + bands.beta + bands.gamma;
  if (total === 0) return 50;
  
  // Beta and gamma indicate active concentration
  const activeRatio = (bands.beta + bands.gamma) / total;
  
  // Alpha and theta indicate relaxation/daydreaming
  const relaxedRatio = (bands.alpha + bands.theta) / total;
  
  // Calculate attention score (0-100)
  let attention = 50; // baseline
  
  if (activeRatio > relaxedRatio) {
    // More active waves than relaxed
    attention = 50 + (activeRatio - relaxedRatio) * 100;
  } else {
    // More relaxed waves than active
    attention = 50 - (relaxedRatio - activeRatio) * 50;
  }
  
  // Add some influence from absolute values
  const betaGammaPower = (bands.beta + bands.gamma) / 1000;
  attention += betaGammaPower * 5;
  
  return Math.min(100, Math.max(0, Math.round(attention)));
}

function calculateMeditation(bands) {
  // Improved meditation calculation
  // Meditation is associated with alpha and theta, less with beta
  
  const total = bands.delta + bands.theta + bands.alpha + bands.beta + bands.gamma;
  if (total === 0) return 50;
  
  // Alpha and theta indicate meditative state
  const meditativeRatio = (bands.alpha + bands.theta) / total;
  
  // Beta indicates active thinking
  const activeRatio = bands.beta / total;
  
  // Calculate meditation score (0-100)
  let meditation = 50; // baseline
  
  if (meditativeRatio > activeRatio) {
    // More meditative waves than active
    meditation = 50 + (meditativeRatio - activeRatio) * 100;
  } else {
    // More active waves than meditative
    meditation = 50 - (activeRatio - meditativeRatio) * 50;
  }
  
  // Alpha specifically is very important for meditation
  const alphaPower = bands.alpha / 1000;
  meditation += alphaPower * 10;
  
  return Math.min(100, Math.max(0, Math.round(meditation)));
}

module.exports = { processEEG };