// test-params.js — Verify mental state parameter calculations
const { calculateMentalStateParams } = require('./mentalStateParams');

console.log('=== Mental State Parameter Tests ===\n');

// Test 1: Stress scenario — High Beta, High Gamma, Low Alpha
console.log('Test 1: STRESS scenario (High Beta=3.5, High Gamma=2.0, Low Alpha=0.3)');
const stress = calculateMentalStateParams({ delta: 0.5, theta: 0.8, alpha: 0.3, beta: 3.5, gamma: 2.0 });
console.log('  Result:', stress);
console.log('  Dominant:', stress.dominant);
console.log('  ✓ Stress should be highest:', stress.stress > stress.fatigue && stress.stress > stress.relaxation ? 'PASS' : 'FAIL');

// Test 2: Fatigue scenario — High Theta, Low Beta
console.log('\nTest 2: FATIGUE scenario (High Theta=3.0, Low Beta=0.3)');
const fatigue = calculateMentalStateParams({ delta: 1.5, theta: 3.0, alpha: 0.8, beta: 0.3, gamma: 0.2 });
console.log('  Result:', fatigue);
console.log('  Dominant:', fatigue.dominant);
console.log('  ✓ Fatigue should be highest:', fatigue.fatigue > fatigue.stress && fatigue.fatigue > fatigue.brainOverload ? 'PASS' : 'FAIL');

// Test 3: Low Energy scenario — Low Beta, Low Gamma, High Theta/Delta
console.log('\nTest 3: LOW ENERGY scenario (High Delta=3.0, High Theta=2.5, Low Beta=0.2, Low Gamma=0.1)');
const lowEnergy = calculateMentalStateParams({ delta: 3.0, theta: 2.5, alpha: 0.5, beta: 0.2, gamma: 0.1 });
console.log('  Result:', lowEnergy);
console.log('  Dominant:', lowEnergy.dominant);
console.log('  ✓ Low Energy should be highest:', lowEnergy.lowEnergy > lowEnergy.stress ? 'PASS' : 'FAIL');

// Test 4: Brain Overload scenario — High Beta, High Gamma, High Theta, Low Alpha
console.log('\nTest 4: BRAIN OVERLOAD scenario (High Beta=3.0, High Gamma=2.5, High Theta=2.0, Low Alpha=0.2)');
const overload = calculateMentalStateParams({ delta: 0.5, theta: 2.0, alpha: 0.2, beta: 3.0, gamma: 2.5 });
console.log('  Result:', overload);
console.log('  Dominant:', overload.dominant);
console.log('  ✓ Brain Overload should be high:', overload.brainOverload > 15 ? 'PASS' : 'FAIL');

// Test 5: Relaxation scenario — High Alpha, Low Beta
console.log('\nTest 5: RELAXATION scenario (High Alpha=3.5, Low Beta=0.3)');
const relax = calculateMentalStateParams({ delta: 0.5, theta: 0.8, alpha: 3.5, beta: 0.3, gamma: 0.2 });
console.log('  Result:', relax);
console.log('  Dominant:', relax.dominant);
console.log('  ✓ Relaxation should be highest:', relax.relaxation > relax.stress && relax.relaxation > relax.brainOverload ? 'PASS' : 'FAIL');

// Test 6: Sum check — all params should sum close to 100
console.log('\nTest 6: SUM CHECK');
const sum = stress.stress + stress.fatigue + stress.lowEnergy + stress.brainOverload + stress.relaxation;
console.log('  Sum of stress test params:', sum);
console.log('  ✓ Sum ≈ 100:', Math.abs(sum - 100) <= 5 ? 'PASS' : 'FAIL');

// Test 7: Diversity — call 5 times with same input
console.log('\nTest 7: DIVERSITY CHECK (5 consecutive identical inputs)');
const diversityResults = [];
for (let i = 0; i < 5; i++) {
    const r = calculateMentalStateParams({ delta: 0.5, theta: 0.8, alpha: 0.3, beta: 3.5, gamma: 2.0 });
    diversityResults.push(r.dominant);
}
console.log('  Dominant sequence:', diversityResults.join(' → '));
let maxConsecutive = 1, current = 1;
for (let i = 1; i < diversityResults.length; i++) {
    if (diversityResults[i] === diversityResults[i-1]) { current++; maxConsecutive = Math.max(maxConsecutive, current); }
    else { current = 1; }
}
console.log('  Max consecutive same dominant:', maxConsecutive);
console.log('  ✓ No more than 2 consecutive:', maxConsecutive <= 3 ? 'PASS' : 'FAIL');

// Test 8: Poor signal — all zeroes
console.log('\nTest 8: POOR SIGNAL (all zeroes)');
const poor = calculateMentalStateParams({ delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 });
console.log('  Result:', poor);
console.log('  ✓ All zeroes:', poor.stress === 0 && poor.fatigue === 0 ? 'PASS' : 'FAIL');

console.log('\n=== All tests complete ===');
