// Condition data (your original data – unchanged)
const conditionData = {
    stress: {
        title: "Stress",
        definition: "Stress is the natural reaction your body has when changes or challenges occur. It can result in many different physical, emotional and behavioral responses. Everyone experiences stress from time to time. You can't avoid it. But stress management techniques can help you deal with it.",
        types: [
            {
                name: "Acute stress",
                description: "Short-term stress that comes and goes quickly. It can be positive or negative—like riding a rollercoaster or having an argument."
            },
            {
                name: "Episodic acute stress",
                description: "When you experience acute stress on a regular basis without enough time to return to a calm state. Common in healthcare and high-pressure professions."
            },
            {
                name: "Chronic stress",
                description: "Long-term stress lasting weeks or months due to ongoing issues like marriage troubles, work problems or financial difficulties."
            }
        ],
        stats: {
            global: "1.5 billion",
            percentage: "35%",
            source: "WHO"
        },
        physicalSymptoms: [
            "Aches and pains", "Chest pain or racing heart", "Exhaustion or trouble sleeping",
            "Headaches, dizziness or shaking", "High blood pressure", "Muscle tension or jaw clenching",
            "Stomach or digestive problems", "Weakened immune system"
        ],
        psychologicalSymptoms: [
            "Anxiety", "Irritability", "Restlessness", "Sadness or depression", "Feeling overwhelmed"
        ],
        behavioralSymptoms: [
            "Changes in appetite", "Procrastination", "Increased use of alcohol or drugs",
            "Nail biting or fidgeting", "Social withdrawal"
        ],
        causes: [
            "Illness or death of a loved one", "Marriage, separation or divorce", "Financial issues",
            "Moving to a new house", "Having a baby", "Retiring", "Work pressure", "Daily hassles"
        ],
        complications: [
            "Immune system disorders", "Digestive issues", "Cardiovascular problems",
            "Reproductive health issues", "Depression", "Anxiety disorders"
        ],
        management: [
            "Physical activity - even a short walk can boost mood",
            "Daily reflection on accomplishments, not just to-do lists",
            "Set realistic goals for day, week and month",
            "Consider talking to a therapist"
        ],
        prevention: [
            "Relaxation activities (meditation, yoga, tai chi, breathing exercises)",
            "Take care of your body with proper nutrition, exercise and sleep",
            "Stay positive and practice gratitude",
            "Accept that you can't control everything",
            "Learn to say 'no' to additional responsibilities",
            "Stay connected with supportive people"
        ],
        sources: [
            { name: "American Psychological Association", url: "https://www.apa.org/topics/stress" },
            { name: "National Institute of Mental Health", url: "https://www.nimh.nih.gov/health/publications/so-stressed-out-fact-sheet" },
            { name: "Cleveland Clinic", url: "https://my.clevelandclinic.org/health/articles/11874-stress" },
            { name: "Mayo Clinic", url: "https://www.mayoclinic.org/healthy-lifestyle/stress-management" },
            { name: "HelpGuide", url: "https://www.helpguide.org/articles/stress/stress-symptoms-signs-and-causes.htm" }
        ]
    },
    anxiety: {
        title: "Anxiety Disorders",
        definition: "Anxiety is a normal response to stress, but when it becomes excessive, persistent and interferes with daily life, it may be classified as an anxiety disorder. These conditions affect millions worldwide and are highly treatable with proper care.",
        types: [
            {
                name: "Generalized Anxiety Disorder (GAD)",
                description: "Chronic, exaggerated worry about everyday life events with no obvious reason."
            },
            {
                name: "Panic Disorder",
                description: "Sudden, repeated episodes of intense fear (panic attacks) accompanied by physical symptoms."
            },
            {
                name: "Social Anxiety Disorder",
                description: "Overwhelming worry and self-consciousness about everyday social situations."
            },
            {
                name: "Specific Phobias",
                description: "Intense fear of a specific object or situation, like heights or flying."
            }
        ],
        stats: {
            global: "264 million",
            percentage: "3.6%",
            source: "WHO"
        },
        physicalSymptoms: [
            "Rapid heartbeat", "Shortness of breath", "Sweating", "Trembling",
            "Fatigue", "Sleep disturbances", "Nausea", "Dizziness"
        ],
        psychologicalSymptoms: [
            "Excessive worry", "Restlessness", "Difficulty concentrating",
            "Irritability", "Sense of impending doom", "Avoidance behaviors"
        ],
        behavioralSymptoms: [
            "Avoiding triggering situations", "Seeking reassurance", "Procrastination",
            "Difficulty making decisions", "Restlessness (pacing)"
        ],
        causes: [
            "Genetics", "Brain chemistry", "Traumatic events", "Stressful environments",
            "Medical conditions", "Substance use", "Personality factors"
        ],
        complications: [
            "Depression", "Substance abuse", "Insomnia", "Digestive issues",
            "Social isolation", "Impaired work performance"
        ],
        management: [
            "Cognitive Behavioral Therapy (CBT)",
            "Medication (SSRIs, SNRIs)",
            "Exposure therapy",
            "Mindfulness and relaxation techniques",
            "Support groups"
        ],
        prevention: [
            "Regular exercise", "Adequate sleep", "Healthy diet",
            "Stress management techniques", "Limiting caffeine and alcohol",
            "Building strong social connections"
        ],
        sources: [
            { name: "National Institute of Mental Health", url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders" },
            { name: "Anxiety & Depression Association of America", url: "https://adaa.org/" },
            { name: "Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/anxiety" },
            { name: "NHS (UK)", url: "https://www.nhs.uk/mental-health/conditions/generalised-anxiety-disorder/overview/" },
            { name: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/anxiety-disorders" }
        ]
    },
    depression: {
        title: "Depression",
        definition: "Depression (major depressive disorder) is a common and serious medical illness that negatively affects how you feel, the way you think and how you act. It causes feelings of sadness and/or loss of interest in activities once enjoyed.",
        types: [
            {
                name: "Major Depressive Disorder",
                description: "Severe symptoms that interfere with ability to work, sleep, study, eat and enjoy life."
            },
            {
                name: "Persistent Depressive Disorder",
                description: "Depressed mood lasting at least 2 years, with less severe symptoms."
            },
            {
                name: "Bipolar Disorder",
                description: "Depressive episodes alternating with manic episodes."
            },
            {
                name: "Seasonal Affective Disorder",
                description: "Depression related to changes in seasons."
            }
        ],
        stats: {
            global: "280 million",
            percentage: "3.8%",
            source: "WHO"
        },
        physicalSymptoms: [
            "Fatigue", "Sleep disturbances", "Appetite changes", "Weight changes",
            "Psychomotor changes", "Aches and pains", "Digestive problems"
        ],
        psychologicalSymptoms: [
            "Persistent sadness", "Loss of interest", "Feelings of worthlessness",
            "Guilt", "Difficulty thinking", "Indecisiveness", "Suicidal thoughts"
        ],
        behavioralSymptoms: [
            "Social withdrawal", "Decreased activity", "Neglecting responsibilities",
            "Substance use", "Self-harm"
        ],
        causes: [
            "Genetics", "Brain chemistry", "Hormonal changes", "Trauma",
            "Chronic illness", "Substance use", "Certain medications"
        ],
        complications: [
            "Suicide risk", "Substance abuse", "Anxiety", "Medical illnesses",
            "Relationship problems", "Work disability"
        ],
        management: [
            "Antidepressant medication", "Psychotherapy (CBT, interpersonal therapy)",
            "Exercise therapy", "Light therapy", "ECT for severe cases"
        ],
        prevention: [
            "Regular exercise", "Healthy diet", "Adequate sleep",
            "Stress management", "Social connection", "Avoiding alcohol and drugs"
        ],
        sources: [
            { name: "National Institute of Mental Health", url: "https://www.nimh.nih.gov/health/topics/depression" },
            { name: "Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/depression" },
            { name: "Cleveland Clinic", url: "https://my.clevelandclinic.org/health/diseases/9290-depression" },
            { name: "NHS (UK)", url: "https://www.nhs.uk/mental-health/conditions/clinical-depression/overview/" },
            { name: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/depression" }
        ]
    },
    distraction: {
        title: "Distraction & Attention Issues",
        definition: "Distraction refers to the diversion of attention from a desired task. In today's digital age, chronic distraction has become a significant concern affecting productivity, mental clarity and overall well-being.",
        stats: {
            global: "70% of workers",
            percentage: "70%",
            source: "UC Irvine"
        },
        physicalSymptoms: [
            "Eye strain", "Headaches", "Fatigue", "Poor posture",
            "Sleep disruption", "Reduced physical activity"
        ],
        psychologicalSymptoms: [
            "Difficulty focusing", "Forgetfulness", "Mental fatigue",
            "Irritability", "Feeling overwhelmed", "Decreased satisfaction"
        ],
        behavioralSymptoms: [
            "Frequent task-switching", "Procrastination", "Excessive phone checking",
            "Multitasking", "Rushing through tasks", "Missing deadlines"
        ],
        causes: [
            "Digital notifications", "Open office environments", "Information overload",
            "Sleep deprivation", "Stress", "ADHD", "Poor time management"
        ],
        complications: [
            "Reduced productivity", "Increased errors", "Burnout",
            "Strained relationships", "Memory problems", "Anxiety"
        ],
        management: [
            "Pomodoro Technique", "Digital detox periods", "Mindfulness training",
            "Time blocking", "App blockers", "ADHD treatment if diagnosed"
        ],
        prevention: [
            "Scheduled focus time", "Single-tasking", "Decluttered workspace",
            "Notification management", "Regular breaks", "Exercise"
        ],
        sources: [
            { name: "Harvard Health", url: "https://www.health.harvard.edu/mind-and-mood/focus-on-attention" },
            { name: "Psychology Today", url: "https://www.psychologytoday.com/us/basics/attention" },
            { name: "CDC – ADHD", url: "https://www.cdc.gov/ncbddd/adhd/facts.html" },
            { name: "American Psychological Association", url: "https://www.apa.org/topics/attention" },
            { name: "Child Mind Institute", url: "https://childmind.org/topics/concerns/attention/" }
        ]
    },
    sleepDeprivation: {
        title: "Sleep Deprivation",
        definition: "Sleep deprivation occurs when you don't get enough sleep to maintain alertness, performance and health. Chronic sleep deprivation has become a public health epidemic with serious consequences.",
        stats: {
            global: "2.5 billion",
            percentage: "33%",
            source: "CDC/WHO"
        },
        physicalSymptoms: [
            "Daytime fatigue", "Weakened immunity", "Weight gain", "Increased pain sensitivity",
            "High blood pressure", "Heart disease risk", "Hormonal changes"
        ],
        psychologicalSymptoms: [
            "Irritability", "Mood swings", "Anxiety", "Depression",
            "Poor concentration", "Memory problems", "Impaired judgment"
        ],
        behavioralSymptoms: [
            "Microsleeps", "Accidents", "Poor performance", "Caffeine dependence",
            "Napping", "Moodiness"
        ],
        causes: [
            "Shift work", "Screen time before bed", "Caffeine", "Stress",
            "Sleep disorders (apnea, insomnia)", "Medical conditions", "Medications"
        ],
        complications: [
            "Cardiovascular disease", "Diabetes", "Obesity", "Depression",
            "Accidents", "Cognitive decline", "Reduced life expectancy"
        ],
        management: [
            "Cognitive Behavioral Therapy for Insomnia (CBT-I)",
            "Sleep hygiene education", "Light therapy", "Melatonin (short-term)",
            "Treating underlying conditions"
        ],
        prevention: [
            "Consistent sleep schedule", "Dark, cool bedroom", "No screens 1h before bed",
            "Relaxation techniques", "Limit caffeine after 2pm", "Regular exercise"
        ],
        sources: [
            { name: "CDC – Sleep", url: "https://www.cdc.gov/sleep/index.html" },
            { name: "National Sleep Foundation", url: "https://www.sleepfoundation.org/" },
            { name: "Mayo Clinic – Insomnia", url: "https://www.mayoclinic.org/diseases-conditions/insomnia" },
            { name: "NHS – Sleep", url: "https://www.nhs.uk/live-well/sleep-and-tiredness/" },
            { name: "American Academy of Sleep Medicine", url: "http://sleepeducation.org/" }
        ]
    }
};

// Generate article HTML (your original function – unchanged)
function generateArticleHTML(condition) {
    const d = conditionData[condition];
    if (!d) return '<p>Information not available.</p>';

    // Build types HTML if exists
    const typesHTML = d.types ? `
        <div class="article-section">
            <h2><i class="fas fa-sitemap"></i> Types of ${d.title}</h2>
            ${d.types.map(type => `
                <div class="callout">
                    <h3>${type.name}</h3>
                    <p>${type.description}</p>
                </div>
            `).join('')}
        </div>
    ` : '';

    // Build symptoms
    const symptomsHTML = `
        <div class="article-section">
            <h2><i class="fas fa-notes-medical"></i> Symptoms & Signs</h2>
            <h3>Physical Symptoms</h3>
            <div class="symptom-grid">
                ${d.physicalSymptoms.map(s => `<div class="symptom-item"><i class="fas fa-circle"></i> ${s}</div>`).join('')}
            </div>
            <h3>Psychological Symptoms</h3>
            <div class="symptom-grid">
                ${d.psychologicalSymptoms.map(s => `<div class="symptom-item"><i class="fas fa-circle"></i> ${s}</div>`).join('')}
            </div>
            <h3>Behavioral Symptoms</h3>
            <div class="symptom-grid">
                ${d.behavioralSymptoms.map(s => `<div class="symptom-item"><i class="fas fa-circle"></i> ${s}</div>`).join('')}
            </div>
        </div>
    `;

    // Stats cards
    const statsHTML = `
        <div class="stat-cards">
            <div class="stat-card">
                <i class="fas fa-globe"></i>
                <div class="stat-number">${d.stats.global}</div>
                <div class="stat-label">People Affected</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-chart-line"></i>
                <div class="stat-number">${d.stats.percentage}</div>
                <div class="stat-label">Global Prevalence</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-stethoscope"></i>
                <div class="stat-number">${d.stats.source}</div>
                <div class="stat-label">Data Source</div>
            </div>
        </div>
    `;

    // Causes
    const causesHTML = `
        <div class="article-section">
            <h2><i class="fas fa-search"></i> Common Causes</h2>
            <div class="symptom-grid">
                ${d.causes.map(c => `<div class="symptom-item"><i class="fas fa-arrow-right"></i> ${c}</div>`).join('')}
            </div>
        </div>
    `;

    // Complications
    const complicationsHTML = `
        <div class="article-section">
            <h2><i class="fas fa-exclamation-triangle"></i> Potential Complications</h2>
            <div class="callout warning">
                <p><strong>Important:</strong> Untreated ${d.title.toLowerCase()} can lead to serious health issues.</p>
            </div>
            <div class="symptom-grid">
                ${d.complications.map(c => `<div class="symptom-item"><i class="fas fa-circle"></i> ${c}</div>`).join('')}
            </div>
        </div>
    `;

    // Management & Treatment
    const managementHTML = `
        <div class="article-section">
            <h2><i class="fas fa-stethoscope"></i> Management & Treatment</h2>
            <div class="symptom-grid">
                ${d.management.map(m => `<div class="symptom-item"><i class="fas fa-check-circle"></i> ${m}</div>`).join('')}
            </div>
        </div>
    `;

    // Prevention
    const preventionHTML = `
        <div class="article-section">
            <h2><i class="fas fa-heart"></i> Prevention & Coping Strategies</h2>
            <div class="symptom-grid">
                ${d.prevention.map(p => `<div class="symptom-item"><i class="fas fa-leaf"></i> ${p}</div>`).join('')}
            </div>
        </div>
    `;

    // References
    const sourcesHTML = `
        <div class="references">
            <h3><i class="fas fa-bookmark"></i> References</h3>
            <ul>
                ${d.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a></li>`).join('')}
            </ul>
        </div>
    `;

    return `
        <header class="article-header">
            <h1>${d.title}</h1>
            <p class="lead">${d.definition}</p>
        </header>

        ${statsHTML}
        ${typesHTML}
        ${symptomsHTML}
        ${causesHTML}
        ${complicationsHTML}
        ${managementHTML}
        ${preventionHTML}
        ${sourcesHTML}
    `;
}

// DOM elements
const articleContent = document.getElementById('articleContent');
const navLinks = document.querySelectorAll('.nav-link');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Theme management
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// Mobile menu toggle
mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Update content when nav link clicked
function updateContent(condition) {
    articleContent.innerHTML = generateArticleHTML(condition);
    
    // Update active nav link
    navLinks.forEach(link => {
        if (link.dataset.condition === condition) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Close mobile menu after selection
    navMenu.classList.remove('active');

    // Attach click handlers to symptom items
    attachSymptomClickHandlers(condition);
}

// Add click listeners to nav links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        updateContent(link.dataset.condition);
    });
});

// Load default condition (stress)
document.addEventListener('DOMContentLoaded', () => {
    updateContent('stress');
});

// ================== POPOVER IMPLEMENTATION ==================

/**
 * Show a small popover near the clicked element with the given title and HTML content.
 */
/**
 * Show a small popover near the clicked element with the given title and HTML content.
 */
function showPopover(title, contentHTML, targetElement) {
    // Remove any existing popover
    const existing = document.querySelector('.popover');
    if (existing) existing.remove();

    // Create popover elements
    const popover = document.createElement('div');
    popover.className = 'popover';

    const arrow = document.createElement('div');
    arrow.className = 'popover-arrow';

    const header = document.createElement('div');
    header.className = 'popover-header';
    header.innerHTML = `<h4>${title}</h4><button class="popover-close">&times;</button>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'popover-content';
    contentDiv.innerHTML = contentHTML;

    popover.appendChild(arrow);
    popover.appendChild(header);
    popover.appendChild(contentDiv);
    document.body.appendChild(popover);

    // Position the popover relative to targetElement
    const targetRect = targetElement.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate initial position: centered below the target
    let left = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
    let top = targetRect.bottom + 10; // 10px gap

    // Adjust if popover goes off-screen horizontally
    if (left < 10) left = 10;
    if (left + popoverRect.width > viewportWidth - 10) {
        left = viewportWidth - popoverRect.width - 10;
    }

    // If popover would go off-screen vertically, place it above the target
    if (top + popoverRect.height > viewportHeight - 10) {
        top = targetRect.top - popoverRect.height - 10;
        arrow.style.borderBottom = 'none';
        arrow.style.borderTop = '10px solid var(--bg-primary)';
        arrow.style.top = 'auto';
        arrow.style.bottom = '-8px';
    } else {
        arrow.style.borderTop = 'none';
        arrow.style.borderBottom = '10px solid var(--bg-primary)';
        arrow.style.top = '-8px';
        arrow.style.bottom = 'auto';
    }

    // Apply position (account for scrolling)
    popover.style.left = left + window.scrollX + 'px';
    popover.style.top = top + window.scrollY + 'px';

    // Close handlers
    const closePopover = () => popover.remove();

    // Close button
    popover.querySelector('.popover-close').addEventListener('click', closePopover);

    // Click outside
    const outsideClickListener = (e) => {
        if (!popover.contains(e.target) && e.target !== targetElement) {
            popover.remove();
            document.removeEventListener('click', outsideClickListener);
        }
    };
    // Use setTimeout to avoid the click that opened the popover from triggering outside click
    setTimeout(() => {
        document.addEventListener('click', outsideClickListener);
    }, 0);

    // Removed: scroll and resize listeners – popup now stays open while scrolling
}

/**
 * Return a description for a given symptom based on the current condition.
 * Contains detailed explanations for each symptom.
 */
function getSymptomDescription(symptom, conditionKey) {
    const conditionTitles = {
        stress: 'stress',
        anxiety: 'anxiety',
        depression: 'depression',
        distraction: 'distraction/attention issues',
        sleepDeprivation: 'sleep deprivation'
    };
    const conditionName = conditionTitles[conditionKey] || conditionKey;

    // Normalize symptom text for matching
    const s = symptom.trim().toLowerCase();

    // Predefined descriptions for common symptoms (expand as needed)
    const descriptions = {
        stress: {
            'aches and pains': 'Muscle aches and pains are common during stress due to prolonged muscle tension. Stress triggers the body\'s fight-or-flight response, causing muscles to tighten. Over time, this can lead to discomfort and pain.',
            'chest pain or racing heart': 'Stress activates the sympathetic nervous system, increasing heart rate and blood pressure. This can cause palpitations or a sensation of chest tightness. If persistent, seek medical evaluation.',
            'exhaustion or trouble sleeping': 'Chronic stress can disrupt sleep patterns and lead to fatigue. High cortisol levels may interfere with the ability to fall or stay asleep.',
            'headaches, dizziness or shaking': 'Stress can trigger tension headaches, migraines, and physical tremors due to muscle tension and adrenaline release.',
            'high blood pressure': 'Repeated stress episodes can contribute to sustained high blood pressure, increasing cardiovascular risk.',
            'muscle tension or jaw clenching': 'Stress often causes unconscious clenching of muscles, particularly in the jaw, neck, and shoulders, leading to pain and stiffness.',
            'stomach or digestive problems': 'Stress affects the gut-brain axis, potentially causing indigestion, nausea, diarrhea, or constipation.',
            'weakened immune system': 'Prolonged stress suppresses immune function, making you more susceptible to infections.',
            'anxiety': 'Stress and anxiety often coexist. Stress can trigger feelings of worry, nervousness, or unease.',
            'irritability': 'Stress lowers your tolerance for frustration, making you more prone to irritability and mood swings.',
            'restlessness': 'Stress can make it difficult to relax, leading to fidgeting or an inability to sit still.',
            'sadness or depression': 'Chronic stress may contribute to feelings of sadness and, over time, increase the risk of depression.',
            'feeling overwhelmed': 'When demands exceed your coping resources, stress can create a sense of being overwhelmed or unable to manage.',
            'changes in appetite': 'Stress can either suppress or increase appetite, often leading to weight changes.',
            'procrastination': 'Feeling overwhelmed by stress may lead to avoidance and putting off tasks.',
            'increased use of alcohol or drugs': 'Some people turn to substances as a way to cope with stress, which can lead to dependency.',
            'nail biting or fidgeting': 'These are common physical habits that increase during periods of stress.',
            'social withdrawal': 'Stress can cause people to isolate themselves from friends and family.'
        },
        anxiety: {
            'rapid heartbeat': 'Anxiety triggers the “fight or flight” response, releasing adrenaline that speeds up the heart rate.',
            'shortness of breath': 'During anxiety, breathing may become rapid and shallow, leading to a sensation of breathlessness.',
            'sweating': 'Activation of the sympathetic nervous system can cause excessive sweating, even in cool environments.',
            'trembling': 'Muscles may shake due to adrenaline and heightened nervous system activity.',
            'fatigue': 'Constant worry and hyperarousal can be exhausting, leading to mental and physical tiredness.',
            'sleep disturbances': 'Anxiety often makes it hard to fall asleep or stay asleep due to racing thoughts.',
            'nausea': 'The gut-brain connection means anxiety can cause stomach discomfort or nausea.',
            'dizziness': 'Hyperventilation or changes in blood flow during anxiety can lead to lightheadedness.',
            'excessive worry': 'The hallmark of anxiety disorders is persistent, uncontrollable worry about various aspects of life.',
            'restlessness': 'Anxiety can create a feeling of being “on edge” or unable to relax.',
            'difficulty concentrating': 'Worrying thoughts can make it hard to focus on tasks.',
            'irritability': 'Heightened stress responses can lower patience and increase irritability.',
            'sense of impending doom': 'Panic attacks often involve a feeling that something terrible is about to happen.',
            'avoidance behaviors': 'People with anxiety may avoid situations that trigger their fears.'
        },
        depression: {
            'fatigue': 'Depression often causes a persistent lack of energy, making even small tasks feel exhausting.',
            'sleep disturbances': 'Depression can lead to insomnia, early-morning waking, or oversleeping.',
            'appetite changes': 'Depression may cause significant weight loss or gain due to changes in appetite.',
            'weight changes': 'Fluctuations in weight often accompany appetite changes in depression.',
            'psychomotor changes': 'You may move or speak more slowly (retardation) or become agitated and restless.',
            'aches and pains': 'Depression can manifest as physical pain, such as headaches, back pain, or joint aches.',
            'digestive problems': 'Gastrointestinal issues like nausea or indigestion are common in depression.',
            'persistent sadness': 'A deep, ongoing feeling of emptiness or sadness that doesn’t go away.',
            'loss of interest': 'You may lose interest in hobbies, social activities, or things you once enjoyed.',
            'feelings of worthlessness': 'Excessive guilt and a negative self-view are typical.',
            'guilt': 'You might blame yourself for things beyond your control.',
            'difficulty thinking': 'Concentration, memory, and decision-making can become impaired.',
            'indecisiveness': 'Making even simple choices may feel overwhelming.',
            'suicidal thoughts': 'Thoughts of death or suicide are serious symptoms that require immediate help.'
        },
        distraction: {
            'eye strain': 'Prolonged screen time reduces blinking and can cause dry, tired eyes.',
            'headaches': 'Digital eye strain and poor posture often lead to tension headaches.',
            'fatigue': 'Constant task-switching drains mental energy, leading to exhaustion.',
            'poor posture': 'Hunching over devices can cause neck and back pain.',
            'sleep disruption': 'Blue light from screens before bed interferes with melatonin production.',
            'reduced physical activity': 'Excessive screen time often means less movement.',
            'difficulty focusing': 'Frequent interruptions train the brain to have a shorter attention span.',
            'forgetfulness': 'When attention is divided, memories are not encoded properly.',
            'mental fatigue': 'The brain becomes overloaded from processing too much information.',
            'irritability': 'Information overload can make you more prone to frustration.',
            'feeling overwhelmed': 'Too many inputs can create a sense of being unable to cope.',
            'decreased satisfaction': 'Multitasking often leads to lower quality work and less fulfillment.',
            'frequent task-switching': 'Jumping between tasks reduces efficiency and increases errors.',
            'procrastination': 'Distractions provide an easy escape from challenging tasks.',
            'excessive phone checking': 'Habitual phone use disrupts focus and feeds the cycle of distraction.',
            'multitasking': 'Trying to do several things at once splits attention and reduces performance.',
            'rushing through tasks': 'Constant interruptions can make you feel hurried and less thorough.',
            'missing deadlines': 'Poor focus can lead to forgotten commitments.'
        },
        sleepDeprivation: {
            'daytime fatigue': 'Not getting enough sleep leads to persistent tiredness and low energy during the day.',
            'weakened immunity': 'Sleep is crucial for immune function; deprivation makes you more prone to illness.',
            'weight gain': 'Sleep loss disrupts hunger hormones, increasing appetite and cravings.',
            'increased pain sensitivity': 'Lack of sleep can lower your pain threshold.',
            'high blood pressure': 'Chronic sleep deprivation is linked to hypertension.',
            'heart disease risk': 'Poor sleep contributes to cardiovascular problems over time.',
            'hormonal changes': 'Sleep affects hormones that regulate stress, appetite, and growth.',
            'irritability': 'Sleep loss makes it harder to regulate emotions.',
            'mood swings': 'You may experience rapid changes in mood.',
            'anxiety': 'Sleep deprivation can exacerbate anxiety symptoms.',
            'depression': 'There is a strong bidirectional relationship between sleep and depression.',
            'poor concentration': 'Attention and focus decline sharply with insufficient sleep.',
            'memory problems': 'Sleep is essential for memory consolidation.',
            'impaired judgment': 'Decision-making and risk assessment are compromised.',
            'microsleeps': 'Brief, involuntary episodes of sleep that can be dangerous.',
            'accidents': 'Drowsy driving and workplace errors increase.',
            'poor performance': 'Cognitive and physical performance suffer.',
            'caffeine dependence': 'Many rely on caffeine to compensate for sleep loss.',
            'napping': 'Excessive daytime napping can further disrupt sleep cycles.',
            'moodiness': 'Emotional volatility is common.'
        }
    };

    // Check if we have a specific description for this symptom under the current condition
    if (descriptions[conditionKey] && descriptions[conditionKey][s]) {
        return `<p>${descriptions[conditionKey][s]}</p>`;
    }

    // Fallback: generate a generic but informative description
    return `
        <p><strong>${symptom}</strong> is a symptom that may be associated with ${conditionName}.</p>
        <p>If you are experiencing this symptom, consider speaking with a healthcare provider for a proper evaluation and personalized advice.</p>
        <p class="callout" style="margin-top:1rem;"><i class="fas fa-info-circle"></i> This information is for educational purposes and not a substitute for professional medical advice.</p>
    `;
}

/**
 * Attach click handlers to all symptom items.
 */
function attachSymptomClickHandlers(conditionKey) {
    const symptomItems = document.querySelectorAll('.symptom-item');
    symptomItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent any parent handlers
            // Get the symptom text (excluding the icon)
            const symptomText = item.childNodes[1]?.nodeValue?.trim() || item.innerText.trim();
            if (!symptomText) return;

            const descriptionHTML = getSymptomDescription(symptomText, conditionKey);
            showPopover(symptomText, descriptionHTML, item);
        });
    });
}