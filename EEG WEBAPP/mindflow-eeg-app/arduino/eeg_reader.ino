// eeg_reader.ino – Read amplified EEG signal and send via Serial

const int analogPin = A0;   // BioAmp EXG Pill output connected to A0
int rawValue = 0;

void setup() {
  Serial.begin(115200);     // Match baud rate in Node.js server
}

void loop() {
  rawValue = analogRead(analogPin);   // 0–1023
  Serial.println(rawValue);
  delay(10);                          // ~100 Hz sampling rate (adjust as needed)
}