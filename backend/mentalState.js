// mentalState.js
function detectMentalState(bands) {
  const d = parseFloat(bands.delta);
  const t = parseFloat(bands.theta);
  const a = parseFloat(bands.alpha);
  const b = parseFloat(bands.beta);
  const g = parseFloat(bands.gamma);

  // If total power is extremely low, signal is likely poor/disconnected
  const totalPower = d + t + a + b + g;
  if (totalPower < 0.5) return 'Poor Signal';

  if (b > 1.5 && a > 1.2) return 'Anxiety';
  if (d > 2.0 && t > 1.8) return 'Fatigue';

  // Nuanced Distraction Logic (Theta/Beta ratio)
  const tbRatio = t / b;
  if (tbRatio > 3.0 && d > 2.0) return 'Highly Distracted';
  // Nuanced Distraction Logic
  if (tbRatio > 3.5 && d > 2.5) return 'Highly Distracted (Drowsy)';
  if (tbRatio > 2.5 && a > 1.8) return 'Mind Wandering';
  if (tbRatio > 2.0) return 'Lightly Distracted';

  if (t > 2.0 && d > 2.2) return 'Stress';
  if (a > 2.0 && g < 0.5) return 'Relaxed';
  if (b > 1.8 && g > 1.0) return 'Focused';
  return 'Neutral';
}

module.exports = { detectMentalState };