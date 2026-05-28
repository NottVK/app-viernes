import mqtt from 'mqtt'

/** Tópicos compartidos con firmware/esp32_emqx_leds */
export const MQTT_TOPICS = {
  control: ['led1/control', 'led2/control', 'led3/control'],
  estado: ['led1/estado', 'led2/estado', 'led3/estado'],
}

const DEFAULT_CONFIG = {
  host: import.meta.env.VITE_MQTT_HOST || 'c4631a6a.ala.eu-central-1.emqxsl.com',
  port: '8084',
  portTcp: '8883',
  user: import.meta.env.VITE_MQTT_USER || '',
  pass: import.meta.env.VITE_MQTT_PASS || '',
  protocol: 'wss',
  path: '/mqtt',
  clientId: 'iot_dashboard_' + Math.random().toString(16).slice(2),
  keepAlive: 60,
  topicControl: 'led1/control',
  topicEstado: 'led1/estado',
  topicColor: 'led/color',
  topicHeartbeat: 'nexusled/heartbeat',
}

/** Puertos por proveedor (documentación oficial). */
const BROKER_PORTS = [
  {
    test: (host) => /emqxsl\.com|\.emqx\.io$/i.test(host) || host.includes('emqx'),
    ws: '8083',
    wss: '8084',
    mqtt: '1883',
    mqtts: '8883',
  },
  {
    test: (host) => host.includes('hivemq'),
    ws: '8000',
    wss: '8884',
    mqtt: '1883',
    mqtts: '8883',
  },
]

export const getBrokerPorts = (host = '') => {
  const h = (host || '').toLowerCase()
  const profile = BROKER_PORTS.find((p) => p.test(h))
  return profile || { ws: '8083', wss: '8084', mqtt: '1883', mqtts: '8883' }
}

/** HTTPS, Capacitor y la mayoría de despliegues web exigen WSS. */
export const requiresSecureWebSocket = () => {
  if (typeof window === 'undefined') return false
  if (window.isSecureContext) return true
  return window.location.protocol === 'https:'
}

export const isBrowserRuntime = () =>
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

const portForProtocol = (protocol, host, config) => {
  const ports = getBrokerPorts(host)
  const custom = String(config.port || '').trim()
  const customTcp = String(config.portTcp || '').trim()

  switch (protocol) {
    case 'wss':
      return custom || ports.wss
    case 'ws':
      return custom || ports.ws
    case 'mqtts':
      return customTcp || custom || ports.mqtts
    case 'mqtt':
      return customTcp || custom || ports.mqtt
    default:
      return custom || ports.wss
  }
}

/** Corrige puerto 8884 con WSS en EMQX (8884 es MQTTS, no WebSocket). */
const fixLegacyEmqxPort = (protocol, host, port) => {
  const p = String(port || '')
  const isEmqx = /emqxsl\.com|\.emqx\.io$/i.test(host) || host.includes('emqx')
  if (!isEmqx) return port
  if (protocol === 'wss' && (p === '8884' || p === '8883')) return '8084'
  if (protocol === 'ws' && (p === '8884' || p === '8883')) return '8083'
  return port
}

export const normalizeMqttConfig = (config) => {
  const next = { ...DEFAULT_CONFIG, ...config }

  // Fallback a las credenciales por defecto si las de localStorage están vacías
  if (!next.user && DEFAULT_CONFIG.user) next.user = DEFAULT_CONFIG.user
  if (!next.pass && DEFAULT_CONFIG.pass) next.pass = DEFAULT_CONFIG.pass

  const host = (next.host || '').trim()
  let protocol = (next.protocol || 'wss').toLowerCase()

  if (isBrowserRuntime() && (protocol === 'mqtt' || protocol === 'mqtts')) {
    protocol = 'wss'
  }
  if (requiresSecureWebSocket() && protocol === 'ws') {
    protocol = 'wss'
  }

  next.port = fixLegacyEmqxPort(protocol, host, next.port)
  next.port = portForProtocol(protocol, host, next)
  next.portTcp = next.portTcp || getBrokerPorts(host).mqtts
  next.protocol = protocol
  next.path = next.path || '/mqtt'
  next.host = host || DEFAULT_CONFIG.host

  return next
}

const getConfig = () => {
  try {
    const saved = localStorage.getItem('mqttConfig')
    if (saved) return normalizeMqttConfig(JSON.parse(saved))
  } catch {
    /* config corrupta */
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

let reconnectTimer = null

const attachHandlers = (c, config) => {
  c.on('connect', () => {
    console.log('MQTT conectado:', buildUrl(config))
    MQTT_TOPICS.estado.forEach((topic) => c.subscribe(topic))
    
    // Suscribir a tópico personalizado si es distinto a los por defecto
    if (config.topicEstado && !MQTT_TOPICS.estado.includes(config.topicEstado)) {
      c.subscribe(config.topicEstado)
    }
  })
  c.on('error', (err) => {
    console.error('MQTT error:', err.message || err)
    if (String(err.message).includes('connack')) {
      console.warn(
        'Sugerencia: EMQX Cloud usa WSS puerto 8084 (no 8884). HiveMQ Cloud usa 8884. Revisa usuario/contraseña en el panel del broker.'
      )
    }
  })
}

const createClient = (config) => {
  const normalized = normalizeMqttConfig(config)

  if (!normalized.user?.trim() || !normalized.pass?.trim()) {
    console.warn('MQTT: usuario o contraseña vacíos. EMQX Cloud requiere autenticación.')
  }

  try {
    const url = buildUrl(normalized)
    const c = mqtt.connect(url, {
      username: normalized.user,
      password: normalized.pass,
      clean: true,
      reconnectPeriod: 15000,
      connectTimeout: 20000,
      clientId: normalized.clientId,
      keepalive: Number(normalized.keepAlive) || 60,
      protocolVersion: 4,
      resubscribe: true,
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
  if (reconnectTimer) clearTimeout(reconnectTimer)
  client = createClient(normalized)
  initialized = true
  return client
}

export const getMqttConfig = getConfig

export const getSuggestedWsPort = (host, protocol = 'wss') =>
  getBrokerPorts(host)[protocol === 'ws' ? 'ws' : 'wss']
