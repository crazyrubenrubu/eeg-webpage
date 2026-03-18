#define ANALOG_PIN    A0
#define BAUD_RATE     115200
#define SAMPLE_DELAY_MS  4   // ~250 Hz (adjust if your app uses different FS_HZ)

void setup() {
  Serial.begin(BAUD_RATE);
  analogReference(DEFAULT);  // 5V reference on Uno
  while (!Serial) { ; }      // Wait for serial on Leonardo/Micro; Uno will skip
}

void loop() {
  int raw = analogRead(ANALOG_PIN);  // 0-1023 for 0-5V
  Serial.println(raw);

  delay(SAMPLE_DELAY_MS);
}
