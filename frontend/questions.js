// questions.js – PSS-10 based questionnaire with full data collection
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztM9I7tgHb1yBUiFSFtjPYM8E3l5vGBTJuctfm5DrOHZ-tNb6ptS3mYpSqEx2nXyCu/exec';

let currentStep = 1;
const totalSteps = 5;

// DOM elements
const loadingOverlay = document.getElementById('loadingOverlay');
const overlay = document.getElementById('resultOverlay');
const overlayCondition = document.getElementById('overlayCondition');
const solutionsContent = document.getElementById('solutionsContent');

// ---------- Toast notification functions ----------
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

// Step navigation
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
        showError('⚠️ Please enter a valid age.', 'warning');
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

// Step 3 and 4 have no required validation (all questions have default values)
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

// Occupation sub‑options (restored)
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

// Collect all user data (including all fields)
function collectUserData() {
    return {
        timestamp: new Date().toISOString(),
        name: document.getElementById('userName').value,
        age: document.getElementById('userAge').value,
        gender: document.getElementById('userGender').value,
        occupation_main: document.getElementById('occupationMain').value,
        occupation_sub: document.getElementById('occupationSubGroup').style.display !== 'none' ? document.getElementById('occupationSub').value : '',
        relationship: document.getElementById('relationship').value,
        sleep: document.getElementById('habitSleep').value,
        caffeine: document.getElementById('habitCaffeine').value,
        exercise: document.getElementById('habitExercise').value,
        smoking: document.getElementById('habitSmoking').value,
        alcohol: document.getElementById('habitAlcohol').value,
        other_habits: document.getElementById('habitOther').value,
        pss1: document.getElementById('pss1').value,
        pss2: document.getElementById('pss2').value,
        pss3: document.getElementById('pss3').value,
        pss4: document.getElementById('pss4').value,
        pss5: document.getElementById('pss5').value,
        pss6: document.getElementById('pss6').value,
        pss7: document.getElementById('pss7').value,
        pss8: document.getElementById('pss8').value,
        pss9: document.getElementById('pss9').value,
        pss10: document.getElementById('pss10').value,
        pss_total_score: calculatePSSScoreFromElements() // computed field
    };
}

// Helper to compute total score from DOM (used for storage)
function calculatePSSScoreFromElements() {
    const reverseItems = [4,5,7,8];
    let total = 0;
    for (let i = 1; i <= 10; i++) {
        let val = parseInt(document.getElementById(`pss${i}`).value);
        if (reverseItems.includes(i)) {
            val = 4 - val;
        }
        total += val;
    }
    return total;
}

// Send to Google Sheets
async function sendToGoogleSheets(data) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log('Data sent to Google Sheets');
        showToast('Data saved successfully!');
    } catch (error) {
        console.error('Failed to send to Google Sheets:', error);
        showError('Failed to save data. Please check your connection.', 'error');
    }
}

// Calculate PSS-10 score (using the data object)
function calculatePSSScore(data) {
    const reverseItems = [4,5,7,8];
    let total = 0;
    for (let i = 1; i <= 10; i++) {
        let val = parseInt(data[`pss${i}`]);
        if (reverseItems.includes(i)) {
            val = 4 - val;
        }
        total += val;
    }
    return total;
}

// Get stress level based on score
function getStressLevel(score) {
    if (score <= 13) return 'Low Stress';
    if (score <= 26) return 'Moderate Stress';
    return 'High Stress';
}

// Get recommendations based on stress level
function getRecommendations(level) {
    const map = {
        'Low Stress': 'Great! Your stress level is low. Maintain your healthy habits and continue mindfulness practices.',
        'Moderate Stress': 'You have moderate stress. Consider incorporating relaxation techniques like deep breathing, short walks, or meditation into your daily routine.',
        'High Stress': 'Your stress level is high. It’s important to take active steps to reduce stress. Try guided meditations, regular exercise, and consider speaking with a professional.'
    };
    return map[level] || 'No specific recommendations.';
}

function showResult(level) {
    overlayCondition.innerText = `Stress level: ${level}`;
    solutionsContent.innerHTML = getRecommendations(level);
    overlay.style.display = 'block';
}

window.submitQuestionnaire = async function() {
    const userData = collectUserData();
    await sendToGoogleSheets(userData);

    loadingOverlay.style.display = 'flex';
    setTimeout(() => {
        const score = userData.pss_total_score; // already computed
        const level = getStressLevel(score);
        loadingOverlay.style.display = 'none';
        showResult(level);
    }, 1500);
};

// Overlay button
document.getElementById('viewSolutionsOverlayBtn').addEventListener('click', () => {
    const level = overlayCondition.innerText.replace('Stress level: ', '').toLowerCase().replace(' ', '-');
    window.location.href = `solutions.html?condition=${level}`;
});

// Prevent overlay from closing when clicking inside it
overlay.addEventListener('click', (e) => e.stopPropagation());

// No close on outside click – only close button works.