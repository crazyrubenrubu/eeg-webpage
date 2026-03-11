// chatbot.js – with outside click to close
const chatIcon = document.getElementById('chatIcon');
const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');

let isOpen = false;

function openChat() {
    chatWindow.style.display = 'flex';
    chatWindow.classList.remove('closing');
    isOpen = true;
}

function closeChat() {
    chatWindow.classList.add('closing');
    setTimeout(() => {
        chatWindow.style.display = 'none';
        chatWindow.classList.remove('closing');
    }, 200);
    isOpen = false;
}

chatIcon.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent document click from closing immediately
    if (isOpen) {
        closeChat();
    } else {
        openChat();
    }
});

// Close chat when clicking outside
document.addEventListener('click', (e) => {
    if (isOpen && !chatWindow.contains(e.target) && e.target !== chatIcon) {
        closeChat();
    }
});

// Prevent closing when clicking inside chat window
chatWindow.addEventListener('click', (e) => e.stopPropagation());

// Message sending (same as before)
function addMessage(text, sender = 'user') {
    if (!text.trim()) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-msg' : 'bot-msg';
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function botResponse(userText) {
    const lower = userText.toLowerCase();
    if (lower.includes('alpha')) return 'Alpha waves (8-13 Hz) indicate a relaxed, calm state.';
    if (lower.includes('beta')) return 'Beta waves (13-30 Hz) are linked to active thinking and focus.';
    if (lower.includes('theta')) return 'Theta waves (4-8 Hz) appear during drowsiness or meditation.';
    if (lower.includes('delta')) return 'Delta waves (0.5-4 Hz) are dominant in deep sleep.';
    if (lower.includes('gamma')) return 'Gamma waves (30-45 Hz) are associated with high-level information processing.';
    if (lower.includes('stress')) return 'Stress often shows increased beta and reduced alpha. Try deep breathing.';
    if (lower.includes('meditat')) return 'Meditation can increase alpha and theta waves.';
    return 'I\'m here to help with EEG questions. Ask about brain waves or mental states!';
}

sendChat.addEventListener('click', () => {
    const msg = chatInput.value;
    addMessage(msg, 'user');
    chatInput.value = '';
    setTimeout(() => {
        addMessage('🤖 ' + botResponse(msg), 'bot');
    }, 500);
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChat.click();
});