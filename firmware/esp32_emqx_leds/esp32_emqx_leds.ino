/**
 * ESP32 + EMQX Cloud + LED RGB (cátodo común en Wokwi)
 *
 * Pines ESP32:  Rojo→GPIO27  |  Verde→GPIO25  |  Azul→GPIO23
 * Apagado por defecto. Cada bombillo de la app enciende su canal.
 *
 * App → led1/control, led2/control, led3/control (ON|OFF)
 * ESP32 → led1/estado, led2/estado, led3/estado
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

const char* MQTT_HOST = "c4631a6a.ala.eu-central-1.emqxsl.com";
const int   MQTT_PORT = 8883;
const char* MQTT_USER = "nott_10";
const char* MQTT_PASS = "awdqse12";

const char* TOPIC_LED1_CTRL = "led1/control";
const char* TOPIC_LED1_EST  = "led1/estado";
const char* TOPIC_LED2_CTRL = "led2/control";
const char* TOPIC_LED2_EST  = "led2/estado";
const char* TOPIC_LED3_CTRL = "led3/control";
const char* TOPIC_LED3_EST  = "led3/estado";

// LED RGB: Bombillo1=Rojo GPIO27 | Bombillo2=Verde GPIO25 | Bombillo3=Azul GPIO23
const int PIN_ROJO  = 27;
const int PIN_VERDE = 25;
const int PIN_AZUL  = 23;

const unsigned long RECONNECT_WIFI_MS = 10000;
const unsigned long RECONNECT_MQTT_MS = 5000;

WiFiClientSecure tlsClient;
PubSubClient mqtt(tlsClient);

unsigned long lastWifiAttempt = 0;
unsigned long lastMqttAttempt = 0;
String clientId;

bool canalRojo  = false;
bool canalVerde = false;
bool canalAzul  = false;

String readPayload(byte* payload, unsigned int length) {
  String msg;
  msg.reserve(length);
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  msg.trim();
  msg.toUpperCase();
  return msg;
}

/** Aplica el color al LED RGB físico (todos LOW = apagado). */
void aplicarRgb() {
  digitalWrite(PIN_ROJO,  canalRojo  ? HIGH : LOW);
  digitalWrite(PIN_VERDE, canalVerde ? HIGH : LOW);
  digitalWrite(PIN_AZUL,  canalAzul  ? HIGH : LOW);
}

void probarRgbInicio() {
  digitalWrite(PIN_ROJO, HIGH);
  digitalWrite(PIN_VERDE, LOW);
  digitalWrite(PIN_AZUL, LOW);
  delay(600);
  digitalWrite(PIN_ROJO, LOW);
  digitalWrite(PIN_VERDE, HIGH);
  digitalWrite(PIN_AZUL, LOW);
  delay(600);
  digitalWrite(PIN_ROJO, LOW);
  digitalWrite(PIN_VERDE, LOW);
  digitalWrite(PIN_AZUL, HIGH);
  delay(600);
  canalRojo = canalVerde = canalAzul = false;
  aplicarRgb();
}

void publicarEstado(const char* topic, bool on) {
  if (mqtt.connected()) mqtt.publish(topic, on ? "ON" : "OFF", true);
}

void publicarTodosEstados() {
  publicarEstado(TOPIC_LED1_EST, canalRojo);
  publicarEstado(TOPIC_LED2_EST, canalVerde);
  publicarEstado(TOPIC_LED3_EST, canalAzul);
}

void setCanal(bool& canal, bool on, const char* estadoTopic) {
  canal = on;
  aplicarRgb();
  publicarEstado(estadoTopic, on);
  Serial.printf("RGB -> R:%d G:%d B:%d\n", canalRojo, canalVerde, canalAzul);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String msg = readPayload(payload, length);
  String t = String(topic);

  Serial.printf("MQTT %s = %s\n", topic, msg.c_str());

  if (t == TOPIC_LED1_CTRL) {
    setCanal(canalRojo, msg == "ON", TOPIC_LED1_EST);
  } else if (t == TOPIC_LED2_CTRL) {
    setCanal(canalVerde, msg == "ON", TOPIC_LED2_EST);
  } else if (t == TOPIC_LED3_CTRL) {
    setCanal(canalAzul, msg == "ON", TOPIC_LED3_EST);
  }
}

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

bool mqttConnect() {
  if (!wifiConnected()) return false;

  Serial.print("MQTT -> ");
  if (mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
    Serial.println("OK");
    mqtt.subscribe(TOPIC_LED1_CTRL);
    mqtt.subscribe(TOPIC_LED2_CTRL);
    mqtt.subscribe(TOPIC_LED3_CTRL);

    publicarTodosEstados();
    return true;
  }
  Serial.printf("FALLO rc=%d\n", mqtt.state());
  return false;
}

void setupMqtt() {
  tlsClient.setInsecure();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(60);
}

void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(PIN_ROJO, OUTPUT);
  pinMode(PIN_VERDE, OUTPUT);
  pinMode(PIN_AZUL, OUTPUT);

  canalRojo = canalVerde = canalAzul = false;
  aplicarRgb();  // RGB apagado al iniciar
  probarRgbInicio();

  clientId = "ESP32_";
  clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

  setupMqtt();
  startWifi();

  Serial.println("=== ESP32 LED RGB + EMQX ===");
  Serial.println("R->GPIO27 | G->GPIO25 | B->GPIO23 | Inicio: APAGADO");
}

void loop() {
  if (!wifiConnected()) {
    if (millis() - lastWifiAttempt >= RECONNECT_WIFI_MS) startWifi();
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
