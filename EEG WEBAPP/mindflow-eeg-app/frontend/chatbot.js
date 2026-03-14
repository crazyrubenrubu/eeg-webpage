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
        if (input.includes('stress') || input.includes('anxious')) {
            return "I recommend trying the 4-7-8 breathing technique. Inhale for 4 seconds, hold for 7, and exhale for 8. It naturally lowers Beta brainwaves.";
        } else if (input.includes('focus') || input.includes('distracted')) {
            return "To improve focus, try the Pomodoro technique (25 mins work, 5 mins break). High Gamma and Beta waves usually indicate deep concentration.";
        } else if (input.includes('eeg') || input.includes('brainwave') || input.includes('waves')) {
            return "Your EEG (Electroencephalogram) measures electrical activity in your brain. We track Delta (sleep), Theta (relaxation), Alpha (calm), Beta (active), and Gamma (deep focus).";
        } else if (input.includes('sleep') || input.includes('tired') || input.includes('fatigue')) {
            return "Elevated Theta and Delta waves while you are awake indicate sleep deprivation. Try stepping away from screens for 15 minutes and drinking some water.";
        } else if (input.includes('hello') || input.includes('hi ') || input === 'hi') {
            return "Hi there! How can I help you with your mental wellness today?";
        } else if (input.includes('thank')) {
            return "You're very welcome! I'm always here if you need more help.";
        } else {
            return "That's interesting. While I'm just a demo assistant right now, in the future I'll be able to analyze your live EEG data to give you highly specific feedback on that!";
        }
    }
});