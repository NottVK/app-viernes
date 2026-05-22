import mqtt from 'mqtt'

const host = import.meta.env.VITE_MQTT_HOST
const user = import.meta.env.VITE_MQTT_USER
const pass = import.meta.env.VITE_MQTT_PASS

export const client = mqtt.connect(`wss://${host}:8884/mqtt`, {
  username: user,
  password: pass,
  clean: true,
  reconnectPeriod: 3000,
})

client.on('connect', () => {
  console.log('MQTT conectado')
  // Suscribirse a todos los topics relacionados con los LEDs
  client.subscribe('led/#')
})

client.on('error', (err) => {
  console.error('MQTT error:', err)
})