function detectMentalState(bands) {
  const d = parseFloat(bands.delta);
  const t = parseFloat(bands.theta);
  const a = parseFloat(bands.alpha);
  const b = parseFloat(bands.beta);
  const g = parseFloat(bands.gamma);

  // Enhanced rule-based detection (you can replace with ML later)
  if (b > 1.5 && a > 1.2) return 'Anxiety';
  if (d > 2.0 && t > 1.8) return 'Fatigue';
  if (a < 0.8 && b < 0.6) return 'Distraction';
  if (t > 2.0 && d > 2.2) return 'Stress';
  if (a > 2.0 && g < 0.5) return 'Relaxed';
  if (b > 1.8 && g > 1.0) return 'Focused';
  return 'Neutral';
}

module.exports = { detectMentalState };