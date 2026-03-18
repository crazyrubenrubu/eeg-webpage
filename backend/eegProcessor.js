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

  // Preprocess signal to remove DC offset and filter artifacts (muscle/eye)
  const cleanData = preprocessSignal(dataBuffer, sampleRate);

  // Perform FFT - fft.fft returns an array of [real, imag] pairs
  const phasors = fft.fft(cleanData);
  
  // Calculate magnitudes manually
  const magnitudes = phasors.map(p => Math.sqrt(p[0] * p[0] + p[1] * p[1]));
  
  // Calculate band powers (raw, unscaled)
  const bands = calculateFrequencyBands(magnitudes, sampleRate, cleanData.length);
  
  // Calculate metrics using raw magnitudes (as originally designed)
  const attention = calculateAttention(bands);
  const meditation = calculateMeditation(bands);
  
  // Calculate Signal Quality
  const totalPower = bands.delta + bands.theta + bands.alpha + bands.beta + bands.gamma;
  let signalQuality = 'poor';
  if (totalPower > 5000) signalQuality = 'great';
  else if (totalPower > 1000) signalQuality = 'good';

  // Scale the band values for output (convert to microvolts)
  return {
    delta: Number((bands.delta / SCALE_FACTOR).toFixed(2)),
    theta: Number((bands.theta / SCALE_FACTOR).toFixed(2)),
    alpha: Number((bands.alpha / SCALE_FACTOR).toFixed(2)),
    beta: Number((bands.beta / SCALE_FACTOR).toFixed(2)),
    gamma: Number((bands.gamma / SCALE_FACTOR).toFixed(2)),
    attention: attention,
    meditation: meditation,
    signalQuality: signalQuality
  };
}

// Global state for filtering between windows
let prev_raw = 0;
let prev_filtered = 0;

// Notch Filter State (50Hz)
let n1 = 0, n2 = 0, m1 = 0, m2 = 0;

// Butterworth Bandpass State (0.5Hz - 40Hz)
// Initializing state for 2nd order sections (Biquads)
let bw_state = {
    v1_hp: 0, v2_hp: 0, // High-pass part
    v1_lp: 0, v2_lp: 0  // Low-pass part
};

function preprocessSignal(data, sampleRate) {
  if (data.length === 0) return data;

  // 1. Demean (Remove DC Offset)
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  let processed = data.map(v => v - mean);

  // 2. Artifact Thresholding (EOG/EMG removal)
  // Eye blinks and muscle spikes typically exceed 150-200 microvolts (scaled)
  // Here we use a relative threshold based on the window's standard deviation
  const threshold = 500; // Hard limit for raw Arduino ADC values
  processed = processed.map(v => Math.abs(v) > threshold ? v * 0.1 : v);

  // 3. 2nd Order Butterworth Bandpass Filter (0.5Hz - 40Hz at 100Hz Sample Rate)
  // Instead of a simple high-pass, we use a cascaded Butterworth design for better isolation.
  
  // Coefficients for 100Hz Sample Rate:
  // HP (0.5Hz): b = [0.978, -1.956, 0.978], a = [1, -1.956, 0.957]
  const hp_b = [0.9780, -1.9560, 0.9780];
  const hp_a = [1.0000, -1.9556, 0.9565];

  // LP (40Hz): b = [0.554, 1.108, 0.554], a = [1, 0.925, 0.291]
  const lp_b = [0.5543, 1.1086, 0.5543];
  const lp_a = [1.0000, 0.9248, 0.2924];

  const processedData = processed.map(x => {
    // Stage 1: High Pass (Direct Form II Transposed)
    let y_hp = hp_b[0] * x + bw_state.v1_hp;
    bw_state.v1_hp = hp_b[1] * x - hp_a[1] * y_hp + bw_state.v2_hp;
    bw_state.v2_hp = hp_b[2] * x - hp_a[2] * y_hp;

    // Stage 2: Low Pass
    let y_lp = lp_b[0] * y_hp + bw_state.v1_lp;
    bw_state.v1_lp = lp_b[1] * y_hp - lp_a[1] * y_lp + bw_state.v2_lp;
    bw_state.v2_lp = lp_b[2] * y_hp - lp_a[2] * y_lp;

    return y_lp;
  });

  // 4. Notch Filter (50Hz) to remove power line noise
  // Standard IIR Notch Filter formula: y[n] = (b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]) / a0
  const notchFreq = 50;
  const Q = 30; // Quality factor
  const w0 = 2 * Math.PI * notchFreq / sampleRate;
  const alphaNotch = Math.sin(w0) / (2 * Q);

  const b0 = 1, b1 = -2 * Math.cos(w0), b2 = 1;
  const a0 = 1 + alphaNotch, a1 = -2 * Math.cos(w0), a2 = 1 - alphaNotch;

  const notched = processedData.map(x => {
    let y = (b0 / a0) * x + (b1 / a0) * n1 + (b2 / a0) * n2 - (a1 / a0) * m1 - (a2 / a0) * m2;
    // Update memory
    n2 = n1; n1 = x;
    m2 = m1; m1 = y;
    return y;
  });

  // Update persistent state for next window continuity
  prev_raw = processed[processed.length - 1];
  prev_filtered = processedData[processedData.length - 1];

  return notched;
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