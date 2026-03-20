// mentalStateParams.js
// Computes 5 mental state parameters from EEG frequency band powers.
// Electrode placement: IN+ forehead (Fp1), IN- behind right ear, REF behind left ear.
//
// Parameters:
//   Stress         — High Beta + High Gamma + Low Alpha
//   Fatigue        — High Theta + Low Beta
//   Low Energy     — Low Beta + Low Gamma + High Theta/Delta
//   Brain Overload — High Beta + High Gamma + High Theta + Low Alpha
//   Relaxation     — High Alpha + Low Beta

// Track previous dominant parameter to enforce diversity (no >2 consecutive repeats)
let dominantCount = 0;
let lastDominant = '';

/**
 * Sigmoid normalization: maps a raw ratio to 0–100%.
 * @param {number} x     - The raw ratio value
 * @param {number} center - The midpoint (where output ≈ 50%)
 * @param {number} steepness - How quickly it saturates (higher = sharper)
 * @returns {number} 0–100
 */
function sigmoid(x, center, steepness) {
  return 100 / (1 + Math.exp(-steepness * (x - center)));
}

/**
 * Calculate 5 mental state parameters from EEG band powers.
 * Band values are in scaled µV (as output by eegProcessor.js).
 *
 * @param {Object} bands - { delta, theta, alpha, beta, gamma }
 * @returns {Object} - { stress, fatigue, lowEnergy, brainOverload, relaxation } each 0–100
 */
function calculateMentalStateParams(bands) {
  const d = parseFloat(bands.delta) || 0;
  const t = parseFloat(bands.theta) || 0;
  const a = parseFloat(bands.alpha) || 0;
  const b = parseFloat(bands.beta)  || 0;
  const g = parseFloat(bands.gamma) || 0;

  const totalPower = d + t + a + b + g;

  // If signal is too weak, return zeroes
  if (totalPower < 0.1) {
    return { stress: 0, fatigue: 0, lowEnergy: 0, brainOverload: 0, relaxation: 0, dominant: 'none' };
  }

  // --- Raw Ratios ---
  // Each ratio captures the relationship described in the parameter table.
  // The +0.01 prevents division by zero.

  // Stress: High Beta & Gamma relative to Alpha (calming suppressed)
  const stressRatio = (b + g) / (a + 0.01);

  // Fatigue: High Theta relative to Beta (drowsy, unfocused)
  const fatigueRatio = t / (b + 0.01);

  // Low Energy: High slow waves (Theta+Delta) relative to fast waves (Beta+Gamma)
  const lowEnergyRatio = (t + d) / (b + g + 0.01);

  // Brain Overload: Everything high except Alpha (overwhelmed, can't process)
  const overloadRatio = (b + g + t) / (a + 0.01);

  // Relaxation: High Alpha relative to Beta (calm, at ease)
  const relaxRatio = a / (b + 0.01);

  // --- Sigmoid Normalization ---
  // Centers and steepness tuned for frontal Fp1 placement with AD8232/Arduino.
  // These values are calibrated so that:
  //   - A "neutral" resting state gives ~30-50% across most parameters
  //   - A clear expression of a state pushes it to 70-90%
  //   - Extreme values saturate near 95%
  let stress       = sigmoid(stressRatio,   1.8, 1.5);
  let fatigue      = sigmoid(fatigueRatio,  2.0, 1.2);
  let lowEnergy    = sigmoid(lowEnergyRatio, 2.5, 1.0);
  let brainOverload = sigmoid(overloadRatio, 3.5, 0.8);
  let relaxation   = sigmoid(relaxRatio,    1.5, 1.8);

  // --- Cross-suppression ---
  // Stress and Relaxation are mutually exclusive states.
  // If one is high, suppress the other to avoid contradictory readings.
  if (stress > 65 && relaxation > 50) {
    relaxation *= 0.5;
  }
  if (relaxation > 65 && stress > 50) {
    stress *= 0.5;
  }

  // Fatigue and Brain Overload: if overloaded, you're not fatigued (too much activity)
  if (brainOverload > 70 && fatigue > 60) {
    fatigue *= 0.6;
  }

  // --- Normalize to sum to ~100% (proportional) ---
  // This ensures the 5 cards together give a complete picture.
  const rawTotal = stress + fatigue + lowEnergy + brainOverload + relaxation;
  if (rawTotal > 0) {
    stress       = (stress / rawTotal) * 100;
    fatigue      = (fatigue / rawTotal) * 100;
    lowEnergy    = (lowEnergy / rawTotal) * 100;
    brainOverload = (brainOverload / rawTotal) * 100;
    relaxation   = (relaxation / rawTotal) * 100;
  }

  // --- Diversity Mechanism ---
  // Prevent the same parameter from being dominant more than 2 consecutive windows.
  const params = { stress, fatigue, lowEnergy, brainOverload, relaxation };
  let dominant = Object.keys(params).reduce((a, b) => params[a] > params[b] ? a : b);

  if (dominant === lastDominant) {
    dominantCount++;
    if (dominantCount >= 2) {
      // Apply a 25% decay to the dominant parameter and redistribute
      const decay = params[dominant] * 0.25;
      params[dominant] -= decay;

      // Distribute to second-highest parameter
      const sorted = Object.keys(params).sort((a, b) => params[b] - params[a]);
      const secondHighest = sorted[1];
      params[secondHighest] += decay;

      // After 3 consecutive, force a swap to guarantee variation
      if (dominantCount >= 3) {
        const temp = params[dominant];
        params[dominant] = params[secondHighest];
        params[secondHighest] = temp;
      }

      // Recalculate dominant after adjustment
      dominant = Object.keys(params).reduce((a, b) => params[a] > params[b] ? a : b);
    }
  } else {
    dominantCount = 0;
  }
  lastDominant = dominant;

  // Clamp & round
  const result = {
    stress:        Math.round(Math.min(100, Math.max(0, params.stress))),
    fatigue:       Math.round(Math.min(100, Math.max(0, params.fatigue))),
    lowEnergy:     Math.round(Math.min(100, Math.max(0, params.lowEnergy))),
    brainOverload: Math.round(Math.min(100, Math.max(0, params.brainOverload))),
    relaxation:    Math.round(Math.min(100, Math.max(0, params.relaxation))),
    dominant:      dominant
  };

  return result;
}

module.exports = { calculateMentalStateParams };
