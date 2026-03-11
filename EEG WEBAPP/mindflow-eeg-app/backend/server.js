const { SerialPort } = require('serialport');
const { WebSocketServer } = require('ws');
const { processEEG } = require('./eegProcessor');
const { detectMentalState } = require('./mentalState');
const fs = require('fs');
const path = require('path');

const SERIAL_PORT = 'COM3';          // Change to your Arduino port
const BAUD_RATE = 115200;
const WS_PORT = 8080;
const SAMPLE_RATE = 100;             // Hz, must match Arduino delay
const SAMPLES_PER_WINDOW = 256;       // FFT window size

let rawBuffer = [];
let latestBands = { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 };
let latestState = 'Unknown';
let sessions = [];

// Load previous sessions from file
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
if (fs.existsSync(SESSIONS_FILE)) {
  try {
    sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE));
  } catch (e) { console.error('Could not load sessions'); }
}

function saveSessions() {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions.slice(-50), null, 2));
}

// ---------- Serial Port ----------
let port;
try {
  port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
  console.log(`Serial port ${SERIAL_PORT} opened`);
} catch (e) {
  console.error('Failed to open serial port:', e.message);
  process.exit(1);
}

port.on('data', (line) => {
  const value = parseInt(line.toString().trim());
  if (isNaN(value)) return;

  rawBuffer.push(value);
  if (rawBuffer.length >= SAMPLES_PER_WINDOW) {
    // Process window with FFT
    const bands = processEEG(rawBuffer, SAMPLE_RATE);
    latestBands = bands;
    latestState = detectMentalState(bands);

    // Keep half for overlapping windows (optional)
    rawBuffer = rawBuffer.slice(-SAMPLES_PER_WINDOW / 2);

    broadcast({
      type: 'eeg',
      bands: latestBands,
      state: latestState,
      rawSample: value
    });
  } else {
    broadcast({ type: 'raw', sample: value });
  }
});

port.on('error', (err) => {
  console.error('Serial error:', err.message);
});

// ---------- WebSocket Server ----------
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server on ws://localhost:${WS_PORT}`);

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(JSON.stringify(data));
  });
}

// Handle incoming messages from frontend (e.g., save session, request sessions)
wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'saveSession') {
        const session = {
          timestamp: new Date().toISOString(),
          condition: data.condition,
          bands: data.bands,
          duration: data.duration
        };
        sessions.push(session);
        saveSessions();
        ws.send(JSON.stringify({ type: 'sessions', sessions: sessions.slice(-10) }));
      } else if (data.type === 'getSessions') {
        ws.send(JSON.stringify({ type: 'sessions', sessions: sessions.slice(-10) }));
      }
    } catch (e) {}
  });
});