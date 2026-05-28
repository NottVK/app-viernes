import mqtt from 'mqtt'

const getConfig = () => {
  const saved = localStorage.getItem('mqttConfig')
  if (saved) return JSON.parse(saved)
  return {
    host: import.meta.env.VITE_MQTT_HOST,
    port: '8884',
    user: import.meta.env.VITE_MQTT_USER,
    pass: import.meta.env.VITE_MQTT_PASS,
    protocol: 'wss',
  }
}

const createClient = (config) => {
  const url = `${config.protocol}://${config.host}:${config.port}/mqtt`
  const c = mqtt.connect(url, {
    username: config.user,
    password: config.pass,
    clean: true,
    reconnectPeriod: 3000,
  })
  c.on('connect', () => {
    console.log('MQTT conectado a', config.host)
    c.subscribe('led1/estado')
    c.subscribe('led2/estado')
    c.subscribe('led3/estado')
  })
  c.on('error', (err) => console.error('MQTT error:', err))
  return c
}

export let client = createClient(getConfig())

export const reconnectMqtt = (newConfig) => {
  localStorage.setItem('mqttConfig', JSON.stringify(newConfig))
  if (client.connected) client.end(true)
  client = createClient(newConfig)
  return client
}