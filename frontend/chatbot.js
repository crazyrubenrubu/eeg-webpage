// chatbot.js – Handles the floating AI assistant UI, mock responses, and sound effects

document.addEventListener('DOMContentLoaded', () => {
    const chatIcon = document.getElementById('chatIcon');
    const chatWindow = document.getElementById('chatWindow');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChat = document.getElementById('sendChat');

    if (!chatIcon || !chatWindow) return; // Exit if not on a page with the chatbot

    let isOpen = false;
    let audioCtx;

    // --- Native Browser Synthesizer for UI Sounds ---
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(type) {
        try {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.type = 'sine';

            const now = audioCtx.currentTime;
            
            if (type === 'send') {
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'receive') {
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            console.log("Audio play failed, likely blocked by browser auto-play policy until interaction.", e);
        }
    }
    // ------------------------------------------------

    // Toggle chat window from icon
    chatIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent document click from immediately firing
        if (!isOpen) {
            openChat();
        } else {
            closeChat();
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (isOpen && !chatWindow.contains(e.target) && !chatIcon.contains(e.target)) {
            closeChat();
        }
    });

    // Prevent closing when clicking inside the chat window
    chatWindow.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    function openChat() {
        chatWindow.style.display = 'flex';
        chatWindow.classList.remove('closing');
        isOpen = true;
        
        initAudio();
        
        if (chatMessages.children.length === 0) {
            setTimeout(() => {
                appendMessage("Hello! I'm your MindFlow assistant. Ask me about your EEG readings, relaxation techniques, or how to improve your focus.", 'bot');
                playTone('receive');
            }, 300);
        }
        
        // Focus the input field automatically
        setTimeout(() => chatInput.focus(), 100);
    }

    function closeChat() {
        chatWindow.classList.add('closing');
        setTimeout(() => {
            chatWindow.style.display = 'none';
            chatWindow.classList.remove('closing');
        }, 200); 
        isOpen = false;
    }

    // Send message on button click
    sendChat.addEventListener('click', handleSend);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        playTone('send');
        chatInput.value = '';

        setTimeout(() => {
            const response = generateMockResponse(text.toLowerCase());
            appendMessage(response, 'bot');
            playTone('receive');
        }, 600 + Math.random() * 600); 
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'user' ? 'user-msg' : 'bot-msg';
        msgDiv.innerText = text;
        chatMessages.appendChild(msgDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function generateMockResponse(input) {
        // --- Context Aware Logic ---
        const eegState = window.__EEG_STATE__ || (window.parent && window.parent.__EEG_STATE__);
        
        if (input.includes('how am i') || input.includes('my state') || input.includes('how is my brain')) {
            if (!eegState || !eegState.isConnected) {
                return "I'm not receiving live data right now. Please connect your EEG device or start 'Simulated Mode' on the Dashboard so I can analyze your state!";
            }
            return `Based on your live EEG, you are currently in a "${eegState.state}" state. ${getRemedy(eegState.state)}`;
        }

        if (input.includes('what should i do') || input.includes('help me') || input.includes('remedy')) {
            const state = (eegState && eegState.state) || 'Unknown';
            if (state === 'Unknown' || state === 'Waiting...') {
                return "Try starting a brain monitoring session first! Once I see your data, I can recommend specific wellness techniques.";
            }
            return `For your current "${state}" state, ${getRemedy(state)}`;
        }

        // --- EEG Knowledge Base ---
        if (input.includes('alpha')) {
            return "Alpha waves (8-13 Hz) occur when you are relaxed and calm, but alert. Increasing Alpha is a key goal in meditation.";
        } else if (input.includes('beta')) {
            return "Beta waves (13-30 Hz) represent active thinking, focus, and problem-solving. Too much Beta can sometimes indicate stress.";
        } else if (input.includes('theta')) {
            return "Theta waves (4-8 Hz) are linked to deep relaxation, creativity, and light sleep. High Theta while awake can suggest 'mind wandering'.";
        } else if (input.includes('delta')) {
            return "Delta waves (0.5-4 Hz) are the slowest waves, prominent during deep sleep. High Delta while awake usually indicates fatigue.";
        } else if (input.includes('gamma')) {
            return "Gamma waves (30-50 Hz) are the fastest brainwaves, associated with high-level information processing and peak mental performance.";
        } else if (input.includes('eeg') || input.includes('brainwave') || input.includes('waves')) {
            return "EEG (Electroencephalogram) tracks the electrical activity of your brain. We measure 5 key bands: Delta (sleep), Theta (relaxation), Alpha (calm), Beta (focus), and Gamma (processing).";
        }

        // --- WebApp Help ---
        if (input.includes('dashboard') || input.includes('how to use') || input.includes('start')) {
            return "To start, head to the Dashboard. If you have an Arduino, it will auto-connect. If not, toggle 'Simulated Mode' and hit 'Start Monitoring' to see live analysis!";
        } else if (input.includes('radar') || input.includes('chart')) {
            return "The Radar Chart shows the distribution of your brainwaves in real-time. A balanced shape is usually ideal, depending on your current activity.";
        }

        // --- General Responses ---
        if (input.includes('stress') || input.includes('anxious')) {
            return "I recommend the 4-7-8 breathing technique: Inhale for 4s, hold for 7s, exhale for 8s. This helps lower high Beta activity.";
        } else if (input.includes('focus') || input.includes('distracted')) {
            return "Try a quick 5-minute break or the Pomodoro technique. Usually, a mix of Beta and Gamma waves helps maintain deep concentration.";
        } else if (input.includes('hello') || input.includes('hi ') || input === 'hi') {
            return "Hello! I'm your MindFlow assistant. I can analyze your live EEG or answer questions about your brain health. How are you feeling?";
        } else if (input.includes('thank')) {
            return "You're very welcome! Stay mindful.";
        } else {
            return "That's interesting! I'm specifically trained to help with EEG data and mental wellness. Feel free to ask me 'How is my brain doing?' if you're connected!";
        }
    }

    function getRemedy(state) {
        const remedies = {
            'Focused': "You're in the zone! Remember to take a 5-minute eye break every hour to maintain this state.",
            'Relaxed': "This is a great state for creativity and recovery. Enjoy the calm!",
            'Stress': "Your Beta waves are high. Try 3 rounds of deep box breathing (Inhale 4, Hold 4, Exhale 4, Hold 4).",
            'Anxiety': "Try a grounding exercise: name 5 things you can see and 4 things you can touch.",
            'Fatigue': "High Delta suggests you need rest. A quick 20-minute power nap or stepping away from the screen will help.",
            'Highly Distracted': "Try clearing your workspace and using a single-task approach for the next 15 minutes.",
            'Mind Wandering': "A short mindfulness session or focusing on your breath can help pull you back to the present.",
            'Lightly Distracted': "You're slightly off-task. A quick 'sip of water' break can help reset your focus.",
            'Neutral': "You are in a balanced state. Perfect for everyday tasks!",
            'Unknown': "I'm still learning about your state. Start a session to find out more!"
        };
        return remedies[state] || "Stay mindful and listen to your body.";
    }
});