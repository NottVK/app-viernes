/**
 * ESP32 + EMQX Cloud (MQTTS 8883)
 * Sincronizado con la app web (WSS 8084, mismos tópicos).
 *
 * App publica:  led1/control, led2/control, led3/control  → ON | OFF
 * ESP32 publica: led1/estado,  led2/estado,  led3/estado   → ON | OFF
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ========== WIFI (Wokwi o tu red) ==========
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// ========== EMQX Cloud — MQTTS (ESP32) ==========
// La app en navegador usa WSS puerto 8084; el ESP32 usa TLS puerto 8883.
const char* MQTT_HOST = "c4631a6a.ala.eu-central-1.emqxsl.com";
const int   MQTT_PORT = 8883;
const char* MQTT_USER = "nott_10";
const char* MQTT_PASS = "awdqse12";

// ========== Tópicos (igual que Dashboard.jsx) ==========
const char* TOPIC_LED1_CTRL = "led1/control";
const char* TOPIC_LED1_EST  = "led1/estado";
const char* TOPIC_LED2_CTRL = "led2/control";
const char* TOPIC_LED2_EST  = "led2/estado";
const char* TOPIC_LED3_CTRL = "led3/control";
const char* TOPIC_LED3_EST  = "led3/estado";

// ========== Pines (Wokwi / ESP32) ==========
const int LED_PIN_1 = 3;
const int LED_PIN_2 = 5;
const int LED_PIN_3 = 7;

const unsigned long RECONNECT_WIFI_MS = 10000;
const unsigned long RECONNECT_MQTT_MS = 5000;

WiFiClientSecure tlsClient;
PubSubClient mqtt(tlsClient);

unsigned long lastWifiAttempt = 0;
unsigned long lastMqttAttempt = 0;
String clientId;

// ---------- Utilidades ----------
String readPayload(byte* payload, unsigned int length) {
  String msg;
  msg.reserve(length);
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  return msg;
}

void setLed(int pin, bool on, const char* estadoTopic) {
  digitalWrite(pin, on ? HIGH : LOW);
  mqtt.publish(estadoTopic, on ? "ON" : "OFF", true);  // retain: la app ve el estado al conectar
}

void publishAllEstados() {
  mqtt.publish(TOPIC_LED1_EST, digitalRead(LED_PIN_1) == HIGH ? "ON" : "OFF", true);
  mqtt.publish(TOPIC_LED2_EST, digitalRead(LED_PIN_2) == HIGH ? "ON" : "OFF", true);
  mqtt.publish(TOPIC_LED3_EST, digitalRead(LED_PIN_3) == HIGH ? "ON" : "OFF", true);
}

// ---------- MQTT callback ----------
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String msg = readPayload(payload, length);
  String t = String(topic);

  Serial.println("--- MQTT ---");
  Serial.printf("Topic: %s | Msg: %s\n", topic, msg.c_str());

  if (t == TOPIC_LED1_CTRL) {
    setLed(LED_PIN_1, msg == "ON", TOPIC_LED1_EST);
  } else if (t == TOPIC_LED2_CTRL) {
    setLed(LED_PIN_2, msg == "ON", TOPIC_LED2_EST);
  } else if (t == TOPIC_LED3_CTRL) {
    setLed(LED_PIN_3, msg == "ON", TOPIC_LED3_EST);
  }
}

// ---------- WiFi ----------
void startWifi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("WiFi → %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  lastWifiAttempt = millis();
}

bool wifiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

// ---------- MQTT ----------
bool mqttConnect() {
  if (!wifiConnected()) return false;

  Serial.print("MQTT → ");
  if (mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
    Serial.println("OK");

    mqtt.subscribe(TOPIC_LED1_CTRL);
    mqtt.subscribe(TOPIC_LED2_CTRL);
    mqtt.subscribe(TOPIC_LED3_CTRL);

    publishAllEstados();
    return true;
  }

  Serial.printf("FALLO rc=%d\n", mqtt.state());
  return false;
}

void setupMqtt() {
  tlsClient.setInsecure();  // EMQX Cloud: certificado gestionado por el broker
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(60);
}

// ---------- Arduino ----------
void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(LED_PIN_3, OUTPUT);
  digitalWrite(LED_PIN_1, LOW);
  digitalWrite(LED_PIN_2, LOW);
  digitalWrite(LED_PIN_3, LOW);

  clientId = "ESP32_";
  clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

  setupMqtt();
  startWifi();

  Serial.println();
  Serial.println("=== IoT Panel ESP32 + EMQX ===");
  Serial.printf("Client ID: %s\n", clientId.c_str());
}

void loop() {
  if (!wifiConnected()) {
    if (millis() - lastWifiAttempt >= RECONNECT_WIFI_MS) {
      startWifi();
    }
    return;
  }

  if (!mqtt.connected()) {
    if (millis() - lastMqttAttempt >= RECONNECT_MQTT_MS) {
      lastMqttAttempt = millis();
      mqttConnect();
    }
    return;
  }

  mqtt.loop();
}
