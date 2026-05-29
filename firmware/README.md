# Firmware ESP32 + app web

## Mismo broker, distinto puerto

| Cliente        | Protocolo | Puerto | Ruta    |
|----------------|-----------|--------|---------|
| **ESP32**      | MQTTS     | **8883** | —       |
| **Web / Vercel / APK** | WSS | **8084** | `/mqtt` |

Host: `c4631a6a.ala.eu-central-1.emqxsl.com`

## LED RGB (ESP32)

| Bombillo | Color  | GPIO ESP32 |
|----------|--------|------------|
| 1        | Rojo   | GPIO 7     |
| 2        | Verde  | GPIO 5     |
| 3        | Azul   | GPIO 3     |

Al iniciar el RGB está **apagado**. Cada botón de la app enciende solo su color.

## Tópicos

| Dirección      | Tópico          | Payload   |
|----------------|-----------------|-----------|
| App → ESP32    | `led1/control`  | `ON`/`OFF` |
| App → ESP32    | `led2/control`  | `ON`/`OFF` |
| App → ESP32    | `led3/control`  | `ON`/`OFF` |
| ESP32 → App    | `led1/estado`   | `ON`/`OFF` |
| ESP32 → App    | `led2/estado`   | `ON`/`OFF` |
| ESP32 → App    | `led3/estado`   | `ON`/`OFF` |

## App web (Dashboard → Conexión)

- **Host:** `c4631a6a.ala.eu-central-1.emqxsl.com`
- **Protocolo:** WSS
- **Puerto WebSocket:** `8084` (no 8883 ni 8884)
- **Ruta:** `/mqtt`
- **Usuario / contraseña:** los mismos que en el sketch

## Wokwi

1. Abre `firmware/esp32_emqx_leds/esp32_emqx_leds.ino` en Wokwi.
2. WiFi: `Wokwi-GUEST` (sin contraseña).
3. Simula y revisa el Serial Monitor.

## Arduino IDE

1. Placa: ESP32 Dev Module  
2. Librerías: WiFi (incluida), PubSubClient (Nick O'Leary)
