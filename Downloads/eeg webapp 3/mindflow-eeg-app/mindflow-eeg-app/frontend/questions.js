// questions.js – Handles the multi‑step questionnaire and result display
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

let currentStep = 1;
const totalSteps = 5;

// DOM elements
const loadingOverlay = document.getElementById('loadingOverlay');
const overlay = document.getElementById('resultOverlay');
const overlayCondition = document.getElementById('overlayCondition');
const solutionsContent = document.getElementById('solutionsContent');

// ---------- Toast notification functions (in‑app) ----------
function showError(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `error-toast ${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast success';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Add CSS for error variants if not already in style (they should be in style.css)
// But ensure the toasts appear correctly.

function showStep(step) {
    for (let i = 1; i <= totalSteps; i++) {
        const content = document.getElementById(`step${i}Content`);
        const stepEl = document.getElementById(`step${i}`);
        if (content) content.classList.remove('active');
        if (stepEl) {
            stepEl.classList.remove('active', 'completed');
            if (i < step) stepEl.classList.add('completed');
        }
    }
    const currentContent = document.getElementById(`step${step}Content`);
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentContent) currentContent.classList.add('active');
    if (currentStepEl) currentStepEl.classList.add('active');
    currentStep = step;
}

function validateStep1() {
    const age = document.getElementById('userAge').value;
    const gender = document.getElementById('userGender').value;
    if (!age || age < 1 || age > 120) {
        showError('⚠️ Please enter age.', 'warning');
        return false;
    }
    if (!gender) {
        showError('Please select your gender.', 'warning');
        return false;
    }
    return true;
}

function validateStep2() {
    const occupation = document.getElementById('occupationMain').value;
    const relationship = document.getElementById('relationship').value;
    if (!occupation) {
        showError('Please select your occupation.', 'warning');
        return false;
    }
    if (!relationship) {
        showError('Please select your relationship status.', 'warning');
        return false;
    }
    return true;
}

window.validateAndNext = function(step) {
    if (step === 1 && validateStep1()) nextStep(1);
    else if (step === 2 && validateStep2()) nextStep(2);
    else if (step === 3) nextStep(3);
    else if (step === 4) nextStep(4);
};

window.nextStep = function(step) {
    if (step < totalSteps) showStep(step + 1);
};

window.prevStep = function(step) {
    if (step > 1) showStep(step - 1);
};

// Occupation sub‑options
window.toggleOccupationSub = function() {
    const main = document.getElementById('occupationMain').value;
    const subGroup = document.getElementById('occupationSubGroup');
    const subSelect = document.getElementById('occupationSub');
    const subLabel = document.getElementById('occupationSubLabel');

    let options = [];
    let labelText = 'Specify';

    if (main === 'govt') {
        options = ['Central Government', 'State Government', 'Public Sector Undertaking'];
        labelText = 'Type of government job';
    } else if (main === 'private') {
        options = ['IT/Tech', 'Manufacturing', 'Finance', 'Healthcare', 'Education', 'Retail', 'Other'];
        labelText = 'Industry';
    } else if (main === 'self') {
        options = ['Business Owner', 'Freelancer', 'Consultant', 'Other'];
        labelText = 'Type';
    } else if (main === 'student') {
        options = ['School', 'College/University', 'Postgraduate', 'Vocational'];
        labelText = 'Education level';
    } else if (main === 'unemployed' || main === 'retired' || main === 'homemaker') {
        options = ['Not applicable'];
        labelText = '';
    } else {
        options = ['Other'];
        labelText = 'Please specify';
    }

    if (options.length === 0 || (options.length === 1 && options[0] === 'Not applicable')) {
        subGroup.style.display = 'none';
    } else {
        subGroup.style.display = 'block';
        subLabel.innerText = labelText;
        subSelect.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    }
};

function collectUserData() {
    return {
        name: document.getElementById('userName').value,
        age: document.getElementById('userAge').value,
        gender: document.getElementById('userGender').value,
        occupation_main: document.getElementById('occupationMain').value,
        occupation_sub: document.getElementById('occupationSubGroup').style.display !== 'none' ? document.getElementById('occupationSub').value : '',
        relationship: document.getElementById('relationship').value,
        smoking: document.getElementById('habitSmoking').value,
        alcohol: document.getElementById('habitAlcohol').value,
        gaming: document.getElementById('habitGaming').value,
        other_habits: document.getElementById('habitOther').value,
        stress: document.getElementById('qStress').value,
        anxiety: document.getElementById('qAnxiety').value,
        depression: document.getElementById('qDepression').value,
        sleep_issue: document.getElementById('qSleep').value,
        focus: document.getElementById('qFocus').value,
        timestamp: new Date().toISOString()
    };
}

async function sendToGoogleSheets(data) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log('Data sent to Google Sheets');
    } catch (error) {
        console.error('Failed to send to Google Sheets:', error);
        showError('Failed to save data. Please check your connection.', 'error');
    }
}

// Adaptive model (same as before)
function getAdaptiveCondition(userData) {
    const scores = {
        stress: parseInt(userData.stress),
        anxiety: parseInt(userData.anxiety),
        depression: parseInt(userData.depression),
        sleep: parseInt(userData.sleep_issue),
        focus: parseInt(userData.focus)
    };

    let knowledge = JSON.parse(localStorage.getItem('mindflow_knowledge')) || {
        Stress: { count: 0, total: 0 },
        Anxiety: { count: 0, total: 0 },
        Fatigue: { count: 0, total: 0 },
        Distraction: { count: 0, total: 0 },
        'Mild Depression': { count: 0, total: 0 },
        Relaxed: { count: 0, total: 0 },
        Focused: { count: 0, total: 0 }
    };

    let baselineCondition = 'Neutral';
    if (scores.anxiety >= 4) baselineCondition = 'Anxiety';
    else if (scores.stress >= 4) baselineCondition = 'Stress';
    else if (scores.depression >= 4) baselineCondition = 'Mild Depression';
    else if (scores.sleep >= 4) baselineCondition = 'Fatigue';
    else if (scores.focus >= 4) baselineCondition = 'Distraction';
    else if (scores.stress <= 2 && scores.anxiety <= 2 && scores.depression <= 2) baselineCondition = 'Relaxed';
    else if (scores.focus <= 2 && scores.stress <= 2) baselineCondition = 'Focused';

    if (knowledge[baselineCondition]) {
        knowledge[baselineCondition].count += 1;
        knowledge[baselineCondition].total += (scores.stress + scores.anxiety + scores.depression + scores.sleep + scores.focus) / 5;
    }
    localStorage.setItem('mindflow_knowledge', JSON.stringify(knowledge));

    let bestCondition = baselineCondition;
    let bestScore = Infinity;
    for (let [cond, data] of Object.entries(knowledge)) {
        if (data.count === 0) continue;
        const avgSymptomScore = data.total / data.count;
        const userAvg = (scores.stress + scores.anxiety + scores.depression + scores.sleep + scores.focus) / 5;
        const diff = Math.abs(userAvg - avgSymptomScore);
        if (diff < bestScore) {
            bestScore = diff;
            bestCondition = cond;
        }
    }
    return bestCondition;
}

function getSolutions(condition) {
    const solutionsMap = {
        'Stress': 'Try deep breathing: inhale 4s, hold 4s, exhale 6s. Consider a short walk or mindfulness meditation.',
        'Anxiety': 'Ground yourself: 5-4-3-2-1 technique (see 5 things, touch 4, hear 3, smell 2, taste 1).',
        'Fatigue': 'Take a power nap (10-20 min) or drink water. Avoid screens for a few minutes.',
        'Distraction': 'Use the Pomodoro technique: 25 min focus, 5 min break. Remove phone from sight.',
        'Mild Depression': 'Reach out to a friend, do one small pleasurable activity, or consult a professional.',
        'Focused': 'Great! Keep up the good work. Take short breaks to maintain it.',
        'Relaxed': 'Enjoy this state. You might want to try meditation to cultivate it further.',
        'Neutral': 'Your brain state appears balanced. Continue with your current activities.',
        'Daydreaming': 'Try a light focus exercise or take a short walk.'
    };
    return solutionsMap[condition] || 'No specific suggestions. Stay mindful.';
}

function showResult(condition) {
    overlayCondition.innerText = condition;
    solutionsContent.innerHTML = getSolutions(condition);
    overlay.style.display = 'block';
}

window.submitQuestionnaire = async function() {
    const userData = collectUserData();
    await sendToGoogleSheets(userData);

    loadingOverlay.style.display = 'flex';
    setTimeout(() => {
        const condition = getAdaptiveCondition(userData);
        loadingOverlay.style.display = 'none';
        showResult(condition);
    }, 1500);
};

// Overlay button
document.getElementById('viewSolutionsOverlayBtn').addEventListener('click', () => {
    const condition = overlayCondition.innerText.toLowerCase();
    window.location.href = `solutions.html?condition=${condition}`;
});

// Prevent overlay from closing when clicking inside it
overlay.addEventListener('click', (e) => e.stopPropagation());

// No close on outside click – only close button works.