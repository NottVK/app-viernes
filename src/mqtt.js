import mqtt from 'mqtt'

const DEFAULT_CONFIG = {
  host: import.meta.env.VITE_MQTT_HOST || 'broker.hivemq.cloud',
  port: '8884',
  portTcp: '8883',
  user: import.meta.env.VITE_MQTT_USER || '',
  pass: import.meta.env.VITE_MQTT_PASS || '',
  protocol: 'wss',
  clientId: 'iot_dashboard_' + Math.random().toString(16).slice(2),
  keepAlive: 60,
  topicControl: 'led/control',
  topicEstado: 'led/estado',
  topicColor: 'led/color',
  topicHeartbeat: 'nexusled/heartbeat',
}

/** HTTPS, Capacitor (https://localhost) y la mayoría de despliegues web exigen WSS. */
export const requiresSecureWebSocket = () => {
  if (typeof window === 'undefined') return false
  if (window.isSecureContext) return true
  return window.location.protocol === 'https:'
}

/** En navegador solo funcionan WebSocket (ws/wss), no TCP mqtt/mqtts. */
export const isBrowserRuntime = () =>
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

export const normalizeMqttConfig = (config) => {
  const next = { ...DEFAULT_CONFIG, ...config }
  let protocol = (next.protocol || 'wss').toLowerCase()

  if (isBrowserRuntime() && (protocol === 'mqtt' || protocol === 'mqtts')) {
    protocol = 'wss'
  }

  if (requiresSecureWebSocket() && protocol === 'ws') {
    protocol = 'wss'
  }

  if (protocol === 'mqtts') {
    next.port = next.portTcp || next.port || '8883'
  } else if (protocol === 'wss' && (!next.port || next.port === '1883' || next.port === '8083')) {
    next.port = '8884'
  } else if (protocol === 'ws' && (!next.port || next.port === '8883' || next.port === '8884')) {
    next.port = '8084'
  }

  next.protocol = protocol
  return next
}

const getConfig = () => {
  try {
    const saved = localStorage.getItem('mqttConfig')
    if (saved) return normalizeMqttConfig(JSON.parse(saved))
  } catch {
    /* config corrupta en localStorage */
  }
  return normalizeMqttConfig({})
}

const buildUrl = (config) => {
  const path = config.path || '/mqtt'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${config.protocol}://${config.host}:${config.port}${normalizedPath}`
}

const noop = () => {}
const createStubClient = () => ({
  connected: false,
  on: noop,
  off: noop,
  once: noop,
  publish: noop,
  subscribe: noop,
  end: noop,
})

const attachHandlers = (c, config) => {
  c.on('connect', () => {
    console.log('MQTT conectado a', config.host)
    c.subscribe('led1/estado')
    c.subscribe('led2/estado')
    c.subscribe('led3/estado')
  })
  c.on('error', (err) => console.error('MQTT error:', err))
}

const createClient = (config) => {
  const normalized = normalizeMqttConfig(config)
  try {
    const c = mqtt.connect(buildUrl(normalized), {
      username: normalized.user,
      password: normalized.pass,
      clean: true,
      reconnectPeriod: 3000,
      clientId: normalized.clientId,
      keepalive: Number(normalized.keepAlive) || 60,
    })
    attachHandlers(c, normalized)
    return c
  } catch (err) {
    console.error('No se pudo iniciar MQTT:', err)
    return createStubClient()
  }
}

export let client = createStubClient()
let initialized = false

/** Conecta al broker la primera vez que hace falta (p. ej. al abrir el Dashboard). */
export const initMqtt = () => {
  if (initialized) return client

  const config = getConfig()
  const saved = localStorage.getItem('mqttConfig')
  if (saved && JSON.stringify(config) !== saved) {
    localStorage.setItem('mqttConfig', JSON.stringify(config))
  }

  client = createClient(config)
  initialized = true
  return client
}

export const reconnectMqtt = (newConfig) => {
  const normalized = normalizeMqttConfig(newConfig)
  localStorage.setItem('mqttConfig', JSON.stringify(normalized))
  if (client?.connected) client.end(true)
  client = createClient(normalized)
  initialized = true
  return client
}

export const getMqttConfig = getConfig
