const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { WebSocketServer } = require('ws');
const { processEEG } = require('./eegProcessor');
const { detectMentalState } = require('./mentalState');
const fs = require('fs');
const path = require('path');

const WS_PORT = 8080;
const SAMPLE_RATE = 100; // Hz, must match Arduino delay
const SAMPLES_PER_WINDOW = 256;

let rawBuffer = [];
let latestBands = { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 };
let latestState = 'Unknown';
let sessions = [];
let port = null;
let currentComPort = 'Not connected';

// Load previous sessions
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
if (fs.existsSync(SESSIONS_FILE)) {
  try {
    sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE));
  } catch (e) {
    console.error('Could not load sessions', e);
  }
}

function saveSessions() {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions.slice(-50), null, 2));
}

// Web Server + WebSocket server
const http = require('http');
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, '..', 'frontend', req.url === '/' ? 'index.html' : req.url);
  
  // Basic static file serving
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

const wss = new WebSocketServer({ server });
server.listen(WS_PORT, () => {
  console.log(`Server running at http://localhost:${WS_PORT}`);
  console.log(`WebSocket server active`);
});

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(JSON.stringify(data));
  });
}

// Auto‑detect Arduino
async function findArduinoPort() {
  const ports = await SerialPort.list();
  // Look for typical Arduino vendor IDs or manufacturer name
  const arduinoPort = ports.find(p => 
    (p.vendorId && p.vendorId.toLowerCase().includes('2341')) || // Arduino
    (p.vendorId && p.vendorId.toLowerCase().includes('1a86')) || // CH340
    (p.manufacturer && p.manufacturer.toLowerCase().includes('arduino'))
  );
  return arduinoPort ? arduinoPort.path : null;
}

async function connectToArduino() {
  if (port) {
    try { port.close(); } catch (e) {}
  }
  const comPath = await findArduinoPort();
  if (!comPath) {
    console.log('No Arduino found. Retrying in 5 seconds...');
    setTimeout(connectToArduino, 5000);
    return;
  }
  console.log(`Connecting to Arduino on ${comPath}`);
  currentComPort = comPath;
  broadcast({ type: 'comPort', port: comPath });

  try {
    port = new SerialPort({ path: comPath, baudRate: 115200, autoOpen: false });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.open((err) => {
      if (err) {
        console.error('Error opening port:', err.message);
        setTimeout(connectToArduino, 5000);
        return;
      }
      console.log('Serial port opened');
    });

    parser.on('data', (line) => {
      const value = parseInt(line.trim());
      if (isNaN(value)) return;

      rawBuffer.push(value);
      if (rawBuffer.length >= SAMPLES_PER_WINDOW) {
        const bands = processEEG(rawBuffer, SAMPLE_RATE);
        latestBands = bands;
        latestState = detectMentalState(bands);
        rawBuffer = rawBuffer.slice(-SAMPLES_PER_WINDOW / 2);

        broadcast({
          type: 'eeg',
          bands: latestBands,
          state: latestState,
          rawSample: value
        });
      } else {
        // Throttle raw samples to reduce graph speed (send only every 2nd)
        if (rawBuffer.length % 2 === 0) {
          broadcast({ type: 'raw', sample: value });
        }
      }
    });

    port.on('close', () => {
      console.log('Serial port closed. Reconnecting...');
      currentComPort = 'Not connected';
      broadcast({ type: 'comPort', port: null });
      setTimeout(connectToArduino, 3000);
    });

    port.on('error', (err) => {
      console.error('Serial error:', err.message);
      currentComPort = 'Not connected';
      broadcast({ type: 'comPort', port: null });
    });
  } catch (e) {
    console.error('Failed to open serial port:', e.message);
    setTimeout(connectToArduino, 5000);
  }
}

// Handle WebSocket messages
wss.on('connection', (ws) => {
  // Send current COM port on connection
  ws.send(JSON.stringify({ type: 'comPort', port: currentComPort }));

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
    } catch (e) {
      console.error('Invalid message:', e.message);
    }
  });
});

// Start auto‑connect
connectToArduino();