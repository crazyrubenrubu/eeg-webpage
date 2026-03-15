# Real‑time EEG Brainwave Wellness Monitor by TeamStack-4

MindFlow is a full‑stack EEG monitoring system that reads brainwave data from an Arduino‑connected BioAmp sensor, processes it with FFT to extract frequency bands (Delta, Theta, Alpha, Beta, Gamma), and displays the results in a beautiful, responsive web dashboard. It also includes a questionnaire‑based assessment for users who don’t have an EEG device, and an adaptive learning model that improves predictions over time.

## Features

- **Live EEG Monitoring** – Connects to an Arduino over serial, streams raw data, and performs real‑time FFT analysis.
- **Brainwave Visualisation** – Single merged waveform, brainwave distribution pie chart, and a dominant‑band trend graph.
- **Mental State Detection** – Identifies conditions like Stress, Anxiety, Fatigue, Distraction, etc., based on band power ratios.
- **Brain State Parameters** – Five cards (Stress, Anxiety, Depression, Sleep Deprivation, Distraction) with percentage bars and descriptions.
- **Questionnaire‑based Assessment** – For users without an EEG device, a multi‑step form collects lifestyle and symptom data and returns a predicted mental state using an adaptive model stored in `localStorage`.
- **Theme Toggle** – Switch between light (soft teal) and dark (futuristic purple/green) modes with smooth transitions.
- **Personalised Recommendations** – Click on a detected condition to view suggested remedies (videos, exercises, lifestyle changes).
- **AI Chatbot** – A simple rule‑based assistant answers questions about brainwaves and wellness (extensible to real AI).
- **Data Persistence** – Session results are saved and can be exported; user questionnaire data is sent to Google Sheets.

## System Architecture

Electrodes → BioAmp EXG Pill → Arduino UNO → Serial → Node.js Backend (WebSocket) → Web App Dashboard → Google Sheets


- **Arduino** reads the analog signal from the BioAmp and sends raw values over serial.
- **Node.js** (with `serialport`) reads the serial stream, performs FFT using `fft-js`, calculates band powers, detects mental state, and broadcasts data via WebSocket.
- **Frontend** (HTML/CSS/JS) displays live waveforms, band percentages, and the detected state. It also contains the questionnaire, chatbot, and theme toggle.

## Hardware Requirements

- Arduino UNO (or compatible)
- BioAmp EXG Pill (or any EEG front‑end with analog output)
- Electrodes and connecting wires
- Computer with a USB port

## Software Setup

### 1. Arduino

1. Open `arduino/eeg_reader.ino` in the Arduino IDE.
2. Connect the BioAmp EXG Pill output to analog pin A0.
3. Upload the sketch to your Arduino.
4. Note the COM port (e.g., COM3 on Windows, /dev/ttyUSB0 on Linux).

### 2. Backend

```
cd backend
npm install
```
Edit server.js to set your desired WebSocket port (default 8080). The server automatically detects the Arduino COM port – no manual configuration needed.

```
node server.js
```
Frontend
Serve the frontend folder using any static server. For example:
```
npx live-server frontend
```
with Python:
```
cd frontend
python -m http.server 8000
```
Then open http://localhost:8000 in your browser.
