// ═══════════════════════════════════════════
// 📦 IMPORTS
// ═══════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import * as MqttModule from '../mqtt'

const secureWsOnly = MqttModule.requiresSecureWebSocket()
const browserOnly = MqttModule.isBrowserRuntime()

export default function Dashboard() {
  const navigate = useNavigate()

  // ═══════════════════════════════════════════
  // 🔧 LÓGICA — TEMA Y RESPONSIVE
  // ═══════════════════════════════════════════
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ═══════════════════════════════════════════
  // 🔧 LÓGICA — USUARIO Y PERFIL
  // ═══════════════════════════════════════════
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
        const { data: perfilData } = await supabase
          .from('perfiles').select('*').eq('user_id', data.user.id).single()
        setPerfil(perfilData)
      }
    }
    getUser()
  }, [])
  const nombre = perfil?.nombre || user?.email?.split('@')[0] || 'Usuario'
  const apellido = perfil?.apellido || ''
  const iniciales = (nombre[0] + (apellido[0] || nombre[1] || '')).toUpperCase()
  const fotoUrl = perfil?.foto_url
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ═══════════════════════════════════════════
  // 🔧 LÓGICA — SIDEBAR Y NAVEGACIÓN
  // ═══════════════════════════════════════════
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const navItems = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'bombillos', icon: '💡', label: 'Bombillos' },
    { id: 'mqtt', icon: '◈', label: 'Conexión' },
    { id: 'quienes', icon: '👥', label: 'Quiénes somos' },
    { id: 'soporte', icon: '🛠', label: 'Soporte' },
    { id: 'config', icon: '⚙', label: 'Configuración' },
  ]

  // ═══════════════════════════════════════════
  // 🔧 LÓGICA — BOMBILLOS Y MQTT
  // ═══════════════════════════════════════════
  const [ledOn, setLedOn] = useState(false)
  const [ledOn2, setLedOn2] = useState(false)
  const [ledOn3, setLedOn3] = useState(false)
  const [ledOnCount, setLedOnCount] = useState(0)
  const [ledOffCount, setLedOffCount] = useState(0)
  const [ledOnCount2, setLedOnCount2] = useState(0)
  const [ledOffCount2, setLedOffCount2] = useState(0)
  const [ledOnCount3, setLedOnCount3] = useState(0)
  const [ledOffCount3, setLedOffCount3] = useState(0)
  const [mqttStatus, setMqttStatus] = useState('Conectando...')

  const [editandoMqtt, setEditandoMqtt] = useState(false)
  const [editandoHttp, setEditandoHttp] = useState(false)
  const [httpStatus, setHttpStatus] = useState('Verificando...')
  const [mqttConfig, setMqttConfig] = useState(() => MqttModule.getMqttConfig())
  const [httpConfig, setHttpConfig] = useState(() => {
    const saved = localStorage.getItem('httpConfig')
    return saved ? JSON.parse(saved) : {
      baseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      service: 'supabase',
    }
  })
  const [tempMqttConfig, setTempMqttConfig] = useState(mqttConfig)
  const [tempHttpConfig, setTempHttpConfig] = useState(httpConfig)

  useEffect(() => {
    MqttModule.initMqtt()
    if (MqttModule.client.connected) setMqttStatus('Conectado ✅')
    const handler = (topic, message) => {
      const msg = message.toString().trim().toUpperCase()
      const encendido = msg === 'ON' || msg === '1' || msg === 'TRUE'
      const tEstado1 = mqttConfig.topicEstado || 'led1/estado'
      if (topic === tEstado1) setLedOn(encendido)
      else if (topic === 'led2/estado') setLedOn2(encendido)
      else if (topic === 'led3/estado') setLedOn3(encendido)
    }
    const onConnect = () => setMqttStatus('Conectado ✅')
    const onError = () => setMqttStatus('Error ❌')
    const onOffline = () => setMqttStatus('Desconectado ⚠️')
    
    const activeClient = MqttModule.client
    activeClient.on('message', handler)
    activeClient.on('connect', onConnect)
    activeClient.on('error', onError)
    activeClient.on('offline', onOffline)
    return () => {
      activeClient.off('message', handler)
      activeClient.off('connect', onConnect)
      activeClient.off('error', onError)
      activeClient.off('offline', onOffline)
    }
  }, [mqttConfig])

  const BOMBILLOS = [
    { id: 1, label: 'Bombillo 1 — Sala', color: '#ef4444', colorName: 'Rojo', r: 239, g: 68, b: 68, pin: 'D7 (R)', on: ledOn, onCount: ledOnCount, offCount: ledOffCount },
    { id: 2, label: 'Bombillo 2 — Cocina', color: '#22c55e', colorName: 'Verde', r: 34, g: 197, b: 94, pin: 'D5 (G)', on: ledOn2, onCount: ledOnCount2, offCount: ledOffCount2 },
    { id: 3, label: 'Bombillo 3 — Patio', color: '#2563eb', colorName: 'Azul', r: 37, g: 99, b: 235, pin: 'D3 (B)', on: ledOn3, onCount: ledOnCount3, offCount: ledOffCount3 },
  ]

  const rgbActivo = ledOn || ledOn2 || ledOn3
  const rgbMix = BOMBILLOS.reduce(
    (acc, b) => (b.on ? { r: acc.r + b.r, g: acc.g + b.g, b: acc.b + b.b } : acc),
    { r: 0, g: 0, b: 0 }
  )
  const rgbColor = rgbActivo
    ? `rgb(${Math.min(rgbMix.r, 255)}, ${Math.min(rgbMix.g, 255)}, ${Math.min(rgbMix.b, 255)})`
    : '#334155'

  const handleToggle = (id) => {
    if (!MqttModule.client?.connected) {
      setMqttStatus('Desconectado ⚠️')
      alert('MQTT no está conectado. Ve a Conexión, guarda la configuración y espera a que salga Conectado.')
      return
    }

    let topic = '', newState = false
    if (id === 1) {
      newState = !ledOn; topic = mqttConfig.topicControl || 'led1/control'
      setLedOn(newState)
      if (newState) setLedOnCount(c => c + 1); else setLedOffCount(c => c + 1)
    } else if (id === 2) {
      newState = !ledOn2; topic = 'led2/control'
      setLedOn2(newState)
      if (newState) setLedOnCount2(c => c + 1); else setLedOffCount2(c => c + 1)
    } else if (id === 3) {
      newState = !ledOn3; topic = 'led3/control'
      setLedOn3(newState)
      if (newState) setLedOnCount3(c => c + 1); else setLedOffCount3(c => c + 1)
    }

    MqttModule.client.publish(topic, newState ? 'ON' : 'OFF', { qos: 0, retain: true }, (err) => {
      if (err) {
        setMqttStatus('Error ❌')
        alert(`No se pudo enviar ${topic}: ${err.message || err}`)
      }
    })
  }

  // ═══════════════════════════════════════════
  // 🔧 LÓGICA — CONFIGURACIÓN MQTT Y HTTP
  // ═══════════════════════════════════════════

  useEffect(() => {
    fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
      .then(() => setHttpStatus('Conectado ✅'))
      .catch(() => setHttpStatus('Sin conexión ❌'))
  }, [])

  const guardarMqttConfig = () => {
    const newConfig = MqttModule.normalizeMqttConfig(tempMqttConfig)
    setTempMqttConfig(newConfig)
    MqttModule.reconnectMqtt(newConfig)
    setMqttConfig(newConfig)
    setMqttStatus('Reconectando...')
    setEditandoMqtt(false)
  }

  const guardarHttpConfig = () => {
    localStorage.setItem('httpConfig', JSON.stringify(tempHttpConfig))
    setHttpConfig(tempHttpConfig)
    setEditandoHttp(false)
    alert('✅ Configuración HTTP guardada.')
  }

  // ═══════════════════════════════════════════
  // 🔧 LÓGICA — MIEMBROS
  // ═══════════════════════════════════════════
  const [miembros, setMiembros] = useState([])
  const [editandoMiembro, setEditandoMiembro] = useState(null)
  const [editForm, setEditForm] = useState({ nombre: '', rol: '', foto_url: '', descripcion: '', correo: '', red_social: '', red_social_url: '' })
  const [guardando, setGuardando] = useState(false)
  const [grupoFotoUrl, setGrupoFotoUrl] = useState(null)

  useEffect(() => {
    cargarMiembros()
    const cargarFotoGrupo = async () => {
      const { data } = supabase.storage.from('miembros').getPublicUrl('foto_grupo.jpg')
      if (data?.publicUrl) {
        try {
          const res = await fetch(data.publicUrl, { method: 'HEAD' })
          if (res.ok) setGrupoFotoUrl(data.publicUrl + '?t=' + Date.now())
        } catch (_) {}
      }
    }
    cargarFotoGrupo()
  }, [])

  const cargarMiembros = async () => {
    const { data } = await supabase.from('miembros').select('*').order('orden')
    if (data) setMiembros(data)
  }

  const abrirEdicion = (m) => {
    setEditandoMiembro(m.id)
    setEditForm({
      nombre: m.nombre || '', rol: m.rol || '', foto_url: m.foto_url || '',
      descripcion: m.descripcion || '', correo: m.correo || '',
      red_social: m.red_social || '', red_social_url: m.red_social_url || '',
    })
  }

  const subirFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const fileName = `miembro_${editandoMiembro}.${ext}`
    const { error } = await supabase.storage.from('miembros').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('miembros').getPublicUrl(fileName)
      setEditForm(f => ({ ...f, foto_url: data.publicUrl }))
    }
  }

  const subirFotoGrupo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const { error } = await supabase.storage.from('miembros').upload('foto_grupo.jpg', file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('miembros').getPublicUrl('foto_grupo.jpg')
      setGrupoFotoUrl(data.publicUrl + '?t=' + Date.now())
    } else {
      alert('Error al subir la foto: ' + error.message)
    }
  }

  const guardarMiembro = async () => {
    setGuardando(true)
    await supabase.from('miembros').update({
      nombre: editForm.nombre, rol: editForm.rol,
      foto_url: editForm.foto_url || null,
      descripcion: editForm.descripcion || null,
      correo: editForm.correo || null,
      red_social: editForm.red_social || null,
      red_social_url: editForm.red_social_url || null,
    }).eq('id', editandoMiembro)
    await cargarMiembros()
    setEditandoMiembro(null)
    setGuardando(false)
  }

  // ═══════════════════════════════════════════
  // 🔧 LÓGICA — SOPORTE (FAQ)
  // ═══════════════════════════════════════════
  const [faqOpen, setFaqOpen] = useState(null)
  const faqs = [
    { q: '¿Cómo conecto el ESP32?', a: 'Carga el código Arduino con tus credenciales WiFi y HiveMQ, conecta el relé al GPIO 2 y enciéndelo.' },
    { q: '¿Qué pasa si se va la luz?', a: 'El ESP32 se reconecta automáticamente al WiFi y al broker MQTT al recuperar energía.' },
    { q: '¿Puedo controlar más de un dispositivo?', a: 'Sí, puedes agregar más topics MQTT y más toggles en el dashboard para múltiples dispositivos.' },
    { q: '¿La app funciona sin internet?', a: 'No, necesitas conexión a internet para comunicarte con el broker HiveMQ Cloud.' },
    { q: '¿Cómo cambio mi contraseña?', a: 'Ve a la pantalla de login y usa la opción "¿Olvidaste tu contraseña?" para restablecerla.' },
  ]

  // ═══════════════════════════════════════════
  // 🔧 LÓGICA — GRÁFICAS
  // ═══════════════════════════════════════════
  const mainRef = useRef(null)
  const mqttChartRef = useRef(null)
  const httpChartRef = useRef(null)
  const ledChartRef = useRef(null)
  const ledChartRef2 = useRef(null)
  const ledChartRef3 = useRef(null)
  const mqttChartInst = useRef(null)
  const httpChartInst = useRef(null)
  const ledChartInst = useRef(null)
  const ledChartInst2 = useRef(null)
  const ledChartInst3 = useRef(null)
  const chartsInterval = useRef(null)
  const [scrollY, setScrollY] = useState(0)
  const [carruselIndex, setCarruselIndex] = useState(0)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const handleScroll = () => setScrollY(el.scrollTop)
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCarruselIndex(i => (i + 1) % carruselCards.length), 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!mqttChartRef.current || !httpChartRef.current || !ledChartRef.current) return
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables)
      const rnd = (base, v) => Array.from({ length: 11 }, () => Math.round(base + (Math.random() - 0.5) * v))
      const timeLabels = Array.from({ length: 11 }, (_, i) => `${i * 30}s`)
      if (mqttChartInst.current) mqttChartInst.current.destroy()
      mqttChartInst.current = new Chart(mqttChartRef.current, {
        type: 'line',
        data: { labels: timeLabels, datasets: [
          { label: 'Publicados', data: rnd(18, 12), borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)', tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: '#38bdf8', borderWidth: 2 },
          { label: 'Recibidos', data: rnd(14, 10), borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.06)', tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: '#818cf8', borderDash: [4, 3], borderWidth: 2 },
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#64748b', font: { size: 10 }, autoSkip: true, maxRotation: 0 }, grid: { color: 'rgba(51,65,85,0.5)' } }, y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(51,65,85,0.5)' }, beginAtZero: true } } },
      })
      if (httpChartInst.current) httpChartInst.current.destroy()
      httpChartInst.current = new Chart(httpChartRef.current, {
        type: 'bar',
        data: { labels: timeLabels, datasets: [
          { label: 'Supabase REST', data: rnd(24, 16), backgroundColor: 'rgba(74,222,128,0.75)', borderRadius: 4 },
          { label: 'Auth requests', data: rnd(8, 6), backgroundColor: 'rgba(253,224,71,0.7)', borderRadius: 4 },
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { stacked: true, ticks: { color: '#64748b', font: { size: 10 }, autoSkip: true, maxRotation: 0 }, grid: { color: 'rgba(51,65,85,0.5)' } }, y: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(51,65,85,0.5)' }, beginAtZero: true } } },
      })
      const dCfg = { type: 'doughnut', data: { labels: ['Encendidos', 'Apagados'], datasets: [{ data: [0, 1], backgroundColor: ['#fde047', '#334155'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } } }
      if (ledChartInst.current) ledChartInst.current.destroy()
      ledChartInst.current = new Chart(ledChartRef.current, { ...dCfg, data: JSON.parse(JSON.stringify(dCfg.data)) })
      if (ledChartInst2.current) ledChartInst2.current.destroy()
      ledChartInst2.current = new Chart(ledChartRef2.current, { ...dCfg, data: JSON.parse(JSON.stringify(dCfg.data)) })
      if (ledChartInst3.current) ledChartInst3.current.destroy()
      ledChartInst3.current = new Chart(ledChartRef3.current, { ...dCfg, data: JSON.parse(JSON.stringify(dCfg.data)) })
      if (chartsInterval.current) clearInterval(chartsInterval.current)
      chartsInterval.current = setInterval(() => {
        if (mqttChartInst.current) {
          mqttChartInst.current.data.datasets[0].data.shift()
          mqttChartInst.current.data.datasets[0].data.push(Math.round(10 + Math.random() * 20))
          mqttChartInst.current.data.datasets[1].data.shift()
          mqttChartInst.current.data.datasets[1].data.push(Math.round(8 + Math.random() * 16))
          mqttChartInst.current.update()
        }
        if (httpChartInst.current) {
          httpChartInst.current.data.datasets[0].data.shift()
          httpChartInst.current.data.datasets[0].data.push(Math.round(15 + Math.random() * 22))
          httpChartInst.current.data.datasets[1].data.shift()
          httpChartInst.current.data.datasets[1].data.push(Math.round(4 + Math.random() * 10))
          httpChartInst.current.update()
        }
      }, 2500)
    })
    return () => {
      if (chartsInterval.current) clearInterval(chartsInterval.current)
      if (mqttChartInst.current) mqttChartInst.current.destroy()
      if (httpChartInst.current) httpChartInst.current.destroy()
      if (ledChartInst.current) ledChartInst.current.destroy()
      if (ledChartInst2.current) ledChartInst2.current.destroy()
      if (ledChartInst3.current) ledChartInst3.current.destroy()
    }
  }, [])

  useEffect(() => {
    if (ledChartInst.current) {
      ledChartInst.current.data.datasets[0].data = [ledOnCount, Math.max(ledOffCount, ledOnCount === 0 ? 1 : 0)]
      ledChartInst.current.update()
    }
  }, [ledOnCount, ledOffCount])
  useEffect(() => {
    if (ledChartInst2.current) {
      ledChartInst2.current.data.datasets[0].data = [ledOnCount2, Math.max(ledOffCount2, ledOnCount2 === 0 ? 1 : 0)]
      ledChartInst2.current.update()
    }
  }, [ledOnCount2, ledOffCount2])
  useEffect(() => {
    if (ledChartInst3.current) {
      ledChartInst3.current.data.datasets[0].data = [ledOnCount3, Math.max(ledOffCount3, ledOnCount3 === 0 ? 1 : 0)]
      ledChartInst3.current.update()
    }
  }, [ledOnCount3, ledOffCount3])

  // ═══════════════════════════════════════════
  // 🎨 DATOS ESTÁTICOS DE DECORACIÓN
  // ═══════════════════════════════════════════
  const theme = {
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#94a3b8',
    topbar: 'rgba(248,250,252,0.95)',
    sectionBg: '#f1f5f9',
    sidebar: '#0f172a',
  }
  const progress = Math.min(scrollY / 3, 100)
  const progress2 = Math.min(scrollY / 5, 100)
  const progress3 = Math.min(scrollY / 4, 100)
  const SIDEBAR_WIDTH = 260
  const colores = ['#38bdf8', '#4ade80', '#a78bfa', '#fb923c', '#f472b6', '#fde047']
  const redesSociales = [
    { label: 'Instagram', icon: '📸' }, { label: 'LinkedIn', icon: '💼' },
    { label: 'GitHub', icon: '🐙' }, { label: 'Twitter/X', icon: '🐦' },
    { label: 'Facebook', icon: '👤' }, { label: 'TikTok', icon: '🎵' },
  ]
  const carruselCards = [
    { icon: '💡', title: 'Control inteligente', desc: 'Enciende y apaga dispositivos desde cualquier lugar del mundo en tiempo real.', color: '#fde047', bg: '#1e293b' },
    { icon: '📡', title: 'Conectado siempre', desc: 'Tu ESP32 permanece conectado al broker MQTT para recibir órdenes al instante.', color: '#38bdf8', bg: '#0f2744' },
    { icon: '🔒', title: 'Seguro y privado', desc: 'Autenticación con Supabase y comunicación cifrada WSS para proteger tus datos.', color: '#4ade80', bg: '#0f2918' },
    { icon: '📱', title: 'App móvil nativa', desc: 'Disponible como APK para Android con acceso a cámara, ubicación y más.', color: '#a78bfa', bg: '#1a1040' },
    { icon: '⚡', title: 'Automatización IoT', desc: 'Integra sensores, relés y actuadores para crear un hogar o laboratorio inteligente.', color: '#fb923c', bg: '#2d1200' },
  ]

  // ═══════════════════════════════════════════
  // 🎨 RENDER PRINCIPAL
  // ═══════════════════════════════════════════
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', background: theme.sidebar, transition: 'all 0.5s ease' }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      )}

      {/* ═══════════════════════════════════════
          🎨 DECORACIÓN — MODAL EDITAR MIEMBRO
      ═══════════════════════════════════════ */}
      {editandoMiembro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', margin: 'auto' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '24px' }}>✏️ Editar mi perfil</div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 12px', background: editForm.foto_url ? 'transparent' : '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#0f172a', overflow: 'hidden' }}>
                {editForm.foto_url ? <img src={editForm.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setEditForm(f => ({ ...f, foto_url: '' }))} /> : (editForm.nombre[0] || '?').toUpperCase()}
              </div>
              <label style={{ fontSize: '13px', color: '#0ea5e9', cursor: 'pointer', border: '1px solid #0ea5e9', padding: '6px 14px', borderRadius: '8px', display: 'inline-block' }}>
                📷 Subir foto
                <input type="file" accept="image/*" onChange={subirFoto} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Nombre', key: 'nombre', placeholder: 'Tu nombre completo' },
                { label: 'Rol', key: 'rol', placeholder: 'Ej: Desarrollador Frontend' },
                { label: 'Descripción', key: 'descripcion', placeholder: 'Cuéntanos un poco sobre ti...' },
                { label: 'Correo de contacto', key: 'correo', placeholder: 'tu@correo.com' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>{field.label}</label>
                  {field.key === 'descripcion'
                    ? <textarea value={editForm[field.key]} onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'system-ui' }} />
                    : <input value={editForm[field.key]} onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  }
                </div>
              ))}
              <div>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Red social</label>
                <select value={editForm.red_social} onChange={e => setEditForm(f => ({ ...f, red_social: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}>
                  <option value="">Selecciona una red social</option>
                  {redesSociales.map(r => <option key={r.label} value={r.label}>{r.icon} {r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>URL de la red social</label>
                <input value={editForm.red_social_url} onChange={e => setEditForm(f => ({ ...f, red_social_url: e.target.value }))} placeholder="https://instagram.com/tuusuario" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setEditandoMiembro(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#64748b' }}>Cancelar</button>
                <button onClick={guardarMiembro} disabled={guardando} style={{ flex: 1, padding: '12px', background: '#0ea5e9', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: 'white', fontWeight: '500' }}>{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          🎨 DECORACIÓN — MODAL MQTT
      ═══════════════════════════════════════ */}
      {editandoMqtt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: theme.card, borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', margin: 'auto', border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text, marginBottom: '24px' }}>⚙️ Configurar MQTT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Host del broker', key: 'host', placeholder: 'broker.hivemq.cloud' },
                { label: 'Puerto WebSocket (WSS)', key: 'port', placeholder: MqttModule.getSuggestedWsPort(tempMqttConfig.host || ''), type: 'number' },
                { label: 'Ruta WebSocket', key: 'path', placeholder: '/mqtt' },
                { label: 'Puerto TCP', key: 'portTcp', placeholder: '8883', type: 'number' },
                { label: 'Usuario', key: 'user', placeholder: 'usuario' },
                { label: 'Contraseña', key: 'pass', placeholder: 'contraseña', type: 'password' },
                { label: 'Client ID', key: 'clientId', placeholder: 'iot_dashboard' },
                { label: 'Keep Alive (seg)', key: 'keepAlive', placeholder: '60', type: 'number' },
                { label: 'Tópico control (LED 1)', key: 'topicControl', placeholder: 'led1/control' },
                { label: 'Tópico estado (LED 1)', key: 'topicEstado', placeholder: 'led1/estado' },
                { label: 'Tópico color', key: 'topicColor', placeholder: 'led/color' },
                { label: 'Tópico heartbeat', key: 'topicHeartbeat', placeholder: 'nexusled/heartbeat' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>{field.label}</label>
                  <input type={field.type || 'text'} value={tempMqttConfig[field.key] || ''} onChange={e => setTempMqttConfig(c => ({ ...c, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: theme.card, color: theme.text }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>Protocolo</label>
                <select value={tempMqttConfig.protocol} onChange={e => setTempMqttConfig(c => ({ ...c, protocol: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: theme.card, color: theme.text }}>
                  <option value="wss">WSS (Seguro — web, Vercel, APK)</option>
                  {!secureWsOnly && <option value="ws">WS (solo HTTP local)</option>}
                  {!browserOnly && <option value="mqtt">MQTT (TCP — escritorio/Node)</option>}
                  {!browserOnly && <option value="mqtts">MQTTS (TCP seguro)</option>}
                </select>
                {secureWsOnly && (
                  <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '8px' }}>
                    HTTPS → solo WSS. EMQX (<code>emqxsl.com</code>): puerto <strong>8084</strong>. HiveMQ Cloud: puerto <strong>8884</strong>. Ruta: <strong>/mqtt</strong>.
                  </p>
                )}
              </div>
              <div style={{ background: theme.sectionBg, padding: '12px', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>✅ Al guardar se reconectará automáticamente al nuevo broker sin reiniciar.</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setEditandoMqtt(false); setTempMqttConfig(mqttConfig) }} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: theme.textMuted }}>Cancelar</button>
                <button onClick={guardarMqttConfig} style={{ flex: 1, padding: '12px', background: '#0ea5e9', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: 'white', fontWeight: '500' }}>Guardar y Conectar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          🎨 DECORACIÓN — MODAL HTTP
      ═══════════════════════════════════════ */}
      {editandoHttp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: theme.card, borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', margin: 'auto', border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text, marginBottom: '24px' }}>⚙️ Configurar HTTP</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>Servicio</label>
                <select value={tempHttpConfig.service} onChange={e => setTempHttpConfig(c => ({ ...c, service: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: theme.card, color: theme.text }}>
                  <option value="supabase">Supabase</option>
                  <option value="firebase">Firebase</option>
                  <option value="custom">API Personalizada</option>
                </select>
              </div>
              {[
                { label: 'URL Base', key: 'baseUrl', placeholder: 'https://your-project.supabase.co' },
                { label: 'API Key / Token', key: 'apiKey', placeholder: 'tu-api-key', type: 'password' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>{field.label}</label>
                  <input type={field.type || 'text'} value={tempHttpConfig[field.key]} onChange={e => setTempHttpConfig(c => ({ ...c, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: theme.card, color: theme.text }} />
                </div>
              ))}
              <div style={{ background: theme.sectionBg, padding: '12px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>⚠️ La configuración HTTP se guarda localmente. Reinicia la app para aplicar cambios.</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setEditandoHttp(false); setTempHttpConfig(httpConfig) }} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: theme.textMuted }}>Cancelar</button>
                <button onClick={guardarHttpConfig} style={{ flex: 1, padding: '12px', background: '#0ea5e9', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: 'white', fontWeight: '500' }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          🎨 DECORACIÓN — SIDEBAR
      ═══════════════════════════════════════ */}
      <div style={{ position: isMobile ? 'fixed' : 'relative', left: 0, top: 0, height: '100vh', width: `${SIDEBAR_WIDTH}px`, flexShrink: 0, background: theme.sidebar, borderRight: '1px solid #1e293b', transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)', transition: 'transform 0.3s ease, background 0.5s ease', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>⚡</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>IoT Dashboard</div>
            <div style={{ fontSize: '11px', color: '#38bdf8' }}>ESP32 Control</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: fotoUrl ? 'transparent' : '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '600', color: 'white', overflow: 'hidden', flexShrink: 0 }}>
            {fotoUrl ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciales}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre} {apellido}</div>
            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#475569', letterSpacing: '1px', padding: '8px 20px 4px', textTransform: 'uppercase' }}>Principal</div>
          {navItems.slice(0, 2).map(item => (
            <div key={item.id} onClick={() => { setActiveSection(item.id); if (isMobile) setSidebarOpen(false) }} style={{ padding: '10px 20px', margin: '2px 8px', display: 'flex', alignItems: 'center', gap: '10px', background: activeSection === item.id ? 'linear-gradient(90deg, #0ea5e920, #6366f110)' : 'transparent', borderRadius: '10px', borderLeft: activeSection === item.id ? '3px solid #38bdf8' : '3px solid transparent', cursor: 'pointer', fontSize: '14px', color: activeSection === item.id ? '#f1f5f9' : '#64748b', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              {activeSection === item.id && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />}
            </div>
          ))}
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#475569', letterSpacing: '1px', padding: '12px 20px 4px', textTransform: 'uppercase' }}>Información</div>
          {navItems.slice(2, 5).map(item => (
            <div key={item.id} onClick={() => { setActiveSection(item.id); if (isMobile) setSidebarOpen(false) }} style={{ padding: '10px 20px', margin: '2px 8px', display: 'flex', alignItems: 'center', gap: '10px', background: activeSection === item.id ? 'linear-gradient(90deg, #0ea5e920, #6366f110)' : 'transparent', borderRadius: '10px', borderLeft: activeSection === item.id ? '3px solid #38bdf8' : '3px solid transparent', cursor: 'pointer', fontSize: '14px', color: activeSection === item.id ? '#f1f5f9' : '#64748b', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              {activeSection === item.id && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />}
            </div>
          ))}
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#475569', letterSpacing: '1px', padding: '12px 20px 4px', textTransform: 'uppercase' }}>Configuración</div>
          {navItems.slice(5).map(item => (
            <div key={item.id} onClick={() => { setActiveSection(item.id); if (isMobile) setSidebarOpen(false) }} style={{ padding: '10px 20px', margin: '2px 8px', display: 'flex', alignItems: 'center', gap: '10px', background: activeSection === item.id ? 'linear-gradient(90deg, #0ea5e920, #6366f110)' : 'transparent', borderRadius: '10px', borderLeft: activeSection === item.id ? '3px solid #38bdf8' : '3px solid transparent', cursor: 'pointer', fontSize: '14px', color: activeSection === item.id ? '#f1f5f9' : '#64748b', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              {activeSection === item.id && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>💡 LEDs</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {BOMBILLOS.map((b) => (
                <div key={b.id} title={b.on ? b.colorName : 'Apagado'} style={{ width: '7px', height: '7px', borderRadius: '50%', background: b.on ? b.color : '#475569', boxShadow: b.on ? `0 0 6px ${b.color}` : 'none', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '9px', background: 'transparent', color: '#f87171', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>⎋</span> Cerrar sesión
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          🎨 DECORACIÓN — MAIN
      ═══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        <div style={{ flexShrink: 0, background: theme.topbar, backdropFilter: 'blur(8px)', borderBottom: `1px solid ${theme.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.5s ease', zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px', color: theme.text, padding: '4px 8px', borderRadius: '8px' }}>☰</button>}
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: theme.text }}>{navItems.find(n => n.id === activeSection)?.label}</div>
              <div style={{ fontSize: '12px', color: theme.textMuted }}>Panel IoT — ESP32</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: mqttStatus.includes('✅') ? '#14532d22' : '#78350f22', border: `1px solid ${mqttStatus.includes('✅') ? '#166534' : '#92400e'}`, borderRadius: '20px', padding: '4px 12px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: mqttStatus.includes('✅') ? '#22c55e' : '#f59e0b', boxShadow: mqttStatus.includes('✅') ? '0 0 6px #22c55e' : 'none' }} />
              <span style={{ fontSize: '12px', color: mqttStatus.includes('✅') ? '#22c55e' : '#f59e0b', fontWeight: '500' }}>MQTT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{nombre}</div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>{user?.email}</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: fotoUrl ? 'transparent' : '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: 'white', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: '2px solid #38bdf840' }}>
                {fotoUrl ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciales}
              </div>
            </div>
          </div>
        </div>

        <div ref={mainRef} style={{ flex: 1, overflowY: 'auto', background: theme.bg, transition: 'background 0.5s ease' }}>

          {/* ═══════════════════════════════════════
              🎨 DECORACIÓN — SECCIÓN DASHBOARD
          ═══════════════════════════════════════ */}
          {activeSection === 'dashboard' && (
            <div>
              <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
                <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }}>
                  <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
                </video>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: '700', lineHeight: 1.2, marginBottom: '16px', opacity: Math.max(0, 1 - scrollY / 200), transform: `translateY(${scrollY * 0.3}px)` }}>Bienvenido, {nombre} 👋</div>
                  <div style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: '#94a3b8', opacity: Math.max(0, 1 - scrollY / 150), transform: `translateY(${scrollY * 0.2}px)` }}>Panel de control IoT — ESP32</div>
                  <div style={{ marginTop: '40px', fontSize: '24px', animation: 'bounce 2s infinite', opacity: Math.max(0, 1 - scrollY / 100) }}>↓</div>
                </div>
              </div>
              <div style={{ background: '#0f172a', padding: '60px 20px', borderTop: '1px solid #1e293b' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '600', color: '#f1f5f9' }}>Tráfico de red en tiempo real</div>
                  <div style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>MQTT · HTTP · LED</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
                  <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Protocolo MQTT</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '14px' }}>Mensajes / min</div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#38bdf8' }} />Publicados</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#818cf8' }} />Recibidos</span>
                    </div>
                    <div style={{ position: 'relative', height: '180px' }}><canvas ref={mqttChartRef} /></div>
                  </div>
                  <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Protocolo HTTP</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '14px' }}>Solicitudes / min</div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#4ade80' }} />Supabase REST</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#fde047' }} />Auth requests</span>
                    </div>
                    <div style={{ position: 'relative', height: '180px' }}><canvas ref={httpChartRef} /></div>
                  </div>
                  <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
                    <div style={{ background: carruselCards[carruselIndex].bg, borderRadius: '14px', padding: '28px 20px', border: `1px solid ${carruselCards[carruselIndex].color}33`, textAlign: 'center', minHeight: '165px', transition: 'all 0.4s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '42px', marginBottom: '12px' }}>{carruselCards[carruselIndex].icon}</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: carruselCards[carruselIndex].color, marginBottom: '8px' }}>{carruselCards[carruselIndex].title}</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{carruselCards[carruselIndex].desc}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
                      <button onClick={() => setCarruselIndex(i => (i - 1 + carruselCards.length) % carruselCards.length)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                      <div style={{ display: 'flex', gap: '6px' }}>{carruselCards.map((_, i) => <div key={i} onClick={() => setCarruselIndex(i)} style={{ width: i === carruselIndex ? '18px' : '7px', height: '7px', borderRadius: '4px', cursor: 'pointer', background: i === carruselIndex ? carruselCards[carruselIndex].color : '#334155', transition: 'all 0.3s ease' }} />)}</div>
                      <button onClick={() => setCarruselIndex(i => (i + 1) % carruselCards.length)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'LED 1 (Sala)', ref: ledChartRef, onCount: ledOnCount, offCount: ledOffCount },
                      { label: 'LED 2 (Cocina)', ref: ledChartRef2, onCount: ledOnCount2, offCount: ledOffCount2 },
                      { label: 'LED 3 (Patio)', ref: ledChartRef3, onCount: ledOnCount3, offCount: ledOffCount3 },
                    ].map(led => (
                      <div key={led.label} style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
                          <canvas ref={led.ref} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#fde047' }}>{led.onCount}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '500' }}>{led.label}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Apagados: {led.offCount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ background: '#0f172a', padding: '60px 20px', borderTop: '1px solid #1e293b' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: '600', color: '#f1f5f9' }}>Estado del sistema</div>
                  <div style={{ color: '#94a3b8', marginTop: '8px', fontSize: '14px' }}>Métricas en tiempo real</div>
                </div>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                  {[
                    { label: 'Dispositivos activos', value: Math.round(progress2), color: '#38bdf8' },
                    { label: 'Uptime del sistema', value: Math.round(progress), color: '#4ade80' },
                    { label: 'Señal MQTT', value: Math.round(progress3), color: '#a78bfa' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: '#1e293b', borderRadius: '16px', padding: '28px', border: '1px solid #334155', transform: scrollY > 800 ? 'translateY(0)' : 'translateY(40px)', opacity: scrollY > 800 ? 1 : 0, transition: 'all 0.6s ease' }}>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{stat.label}</div>
                      <div style={{ fontSize: '40px', fontWeight: '700', color: stat.color, marginBottom: '16px' }}>{stat.value}%</div>
                      <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}><div style={{ height: '100%', borderRadius: '3px', background: stat.color, width: `${stat.value}%`, transition: 'width 0.3s ease' }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              🎨 DECORACIÓN — SECCIÓN BOMBILLOS
          ═══════════════════════════════════════ */}
          {activeSection === 'bombillos' && (
            <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: theme.text }}>Control de Bombillos</div>
                <div style={{ color: theme.textMuted, marginTop: '8px' }}>LED RGB — R→D7 · G→D5 · B→D3</div>
              </div>

              <div style={{ background: theme.card, borderRadius: '20px', padding: '24px', border: `1px solid ${theme.border}`, marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LED RGB (Wokwi)</div>
                <div style={{
                  width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 12px',
                  background: rgbActivo ? rgbColor : '#334155',
                  border: `3px solid ${rgbActivo ? rgbColor : '#475569'}`,
                  boxShadow: rgbActivo ? `0 0 32px ${rgbColor}, 0 0 64px ${rgbColor}55` : 'inset 0 0 12px #0f172a',
                  transition: 'all 0.35s ease',
                  opacity: rgbActivo ? 1 : 0.45,
                }} />
                <div style={{ fontSize: '15px', fontWeight: '600', color: rgbActivo ? theme.text : theme.textMuted }}>
                  {rgbActivo
                    ? `Encendido — ${[ledOn && 'Rojo', ledOn2 && 'Verde', ledOn3 && 'Azul'].filter(Boolean).join(' + ')}`
                    : 'Apagado'}
                </div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>
                  {rgbActivo ? rgbColor : 'Sin señal en los canales R, G ni B'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {BOMBILLOS.map(b => (
                  <div key={b.id} style={{
                    background: theme.card, borderRadius: '20px', padding: '28px',
                    border: `2px solid ${b.on ? b.color : theme.border}`,
                    display: 'flex', alignItems: 'center', gap: '24px',
                    boxShadow: b.on ? `0 0 28px ${b.color}44` : 'none',
                    transition: 'all 0.35s ease',
                  }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      background: b.on ? b.color : '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: b.on ? `0 0 24px ${b.color}` : 'inset 0 2px 8px #cbd5e1',
                      border: `3px solid ${b.on ? b.color : '#cbd5e1'}`,
                      transition: 'all 0.35s ease',
                    }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
                        color: b.on ? '#fff' : '#94a3b8', textTransform: 'uppercase',
                      }}>
                        {b.on ? b.colorName : 'OFF'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>{b.label}</div>
                      <div style={{
                        display: 'inline-block', fontSize: '13px', fontWeight: '600',
                        color: b.on ? '#fff' : theme.textMuted,
                        background: b.on ? b.color : '#f1f5f9',
                        padding: '4px 12px', borderRadius: '20px', marginBottom: '8px',
                      }}>
                        {b.on ? b.colorName : 'Apagado'}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Canal {b.pin} · {b.on ? 'Encendido' : 'Apagado'}</div>
                      <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '16px' }}>Encendidos: {b.onCount} · Apagados: {b.offCount}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: theme.textMuted }}>OFF</span>
                        <div onClick={() => handleToggle(b.id)} style={{
                          width: '64px', height: '32px',
                          background: b.on ? b.color : '#cbd5e1',
                          borderRadius: '16px', cursor: 'pointer', position: 'relative',
                          transition: 'background 0.25s ease',
                        }}>
                          <div style={{
                            width: '24px', height: '24px', background: 'white', borderRadius: '50%',
                            position: 'absolute', top: '4px', left: b.on ? '36px' : '4px',
                            transition: 'left 0.25s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: theme.textMuted }}>ON</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              🎨 DECORACIÓN — SECCIÓN CONEXIÓN MQTT
          ═══════════════════════════════════════ */}
          {activeSection === 'mqtt' && (
            <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0ea5e920', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔧</div>
                  <div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Broker activo</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>{mqttConfig.host || 'Sin configurar'}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: mqttStatus.includes('✅') ? '#14532d33' : '#78350f33', border: `1px solid ${mqttStatus.includes('✅') ? '#166534' : '#92400e'}`, borderRadius: '20px', padding: '4px 12px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: mqttStatus.includes('✅') ? '#22c55e' : '#f59e0b', boxShadow: mqttStatus.includes('✅') ? '0 0 6px #22c55e' : 'none' }} />
                    <span style={{ fontSize: '12px', color: mqttStatus.includes('✅') ? '#22c55e' : '#f59e0b', fontWeight: '600' }}>{mqttStatus.includes('✅') ? 'Conectado' : mqttStatus.includes('Reconectando') ? 'Reconectando...' : 'Desconectado'}</span>
                  </div>
                </div>
              </div>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0ea5e920', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🖥️</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>Servidor Broker MQTT</div>
                  </div>
                  <button onClick={() => setEditandoMqtt(true)} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>✏️ Editar</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ background: theme.sectionBg, borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puerto MQTT</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>↔️</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#38bdf8' }}>{mqttConfig.portTcp || '8883'}</span>
                    </div>
                  </div>
                  <div style={{ background: theme.sectionBg, borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puerto WebSocket</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🌐</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#38bdf8' }}>{mqttConfig.port || MqttModule.getSuggestedWsPort(mqttConfig.host)}</span>
                    </div>
                  </div>
                </div>
                {[
                  { label: 'Tópico de Control', value: mqttConfig.topicControl || 'led/control', color: '#38bdf8' },
                  { label: 'Tópico de Estado', value: mqttConfig.topicEstado || 'led/estado', color: '#38bdf8' },
                  { label: 'Tópico de Color', value: mqttConfig.topicColor || 'led/color' },
                  { label: 'Tópico de Heartbeat', value: mqttConfig.topicHeartbeat || 'nexusled/heartbeat' },
                  { label: 'Client ID', value: mqttConfig.clientId || 'iot_dashboard' },
                  { label: 'Keep Alive', value: `${mqttConfig.keepAlive || 60}s` },
                  { label: 'Usuario MQTT', value: mqttConfig.user || 'Sin configurar' },
                  { label: 'Contraseña MQTT', value: mqttConfig.pass ? '••••••••' : 'Sin configurar' },
                  { label: 'Protocolo', value: (mqttConfig.protocol || 'wss').toUpperCase() },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '13px', color: theme.textMuted }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: item.color || theme.text }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#4ade8020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🌐</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>Conexión HTTP / Supabase</div>
                  </div>
                  <button onClick={() => setEditandoHttp(true)} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>✏️ Editar</button>
                </div>
                {[
                  { label: 'Internet', value: httpStatus, color: httpStatus.includes('✅') ? '#22c55e' : '#ef4444' },
                  { label: 'Base de datos', value: 'Supabase ✅', color: '#22c55e' },
                  { label: 'Autenticación', value: 'Supabase Auth ✅', color: '#22c55e' },
                  { label: 'Protocolo', value: 'HTTPS / REST API' },
                  { label: 'Servicio', value: httpConfig.service },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '13px', color: theme.textMuted }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: item.color || theme.text }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              🎨 DECORACIÓN — SECCIÓN QUIÉNES SOMOS
          ═══════════════════════════════════════ */}
          {activeSection === 'quienes' && (
            <div style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
              <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '20px', overflow: 'hidden', marginBottom: '32px', border: '1px solid #1e4080' }}>
                <div style={{ position: 'relative', width: '100%', height: '200px', background: grupoFotoUrl ? 'transparent' : 'linear-gradient(135deg, #0c2340, #1a4a8a)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {grupoFotoUrl ? <img src={grupoFotoUrl} alt="Foto del grupo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setGrupoFotoUrl(null)} /> : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.4 }}>📸</div>
                      <div style={{ fontSize: '13px', opacity: 0.5 }}>Foto del grupo</div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0f172a 100%)' }} />
                  <label style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(14,165,233,0.9)', color: 'white', fontSize: '12px', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                    📷 {grupoFotoUrl ? 'Cambiar foto' : 'Subir foto'}
                    <input type="file" accept="image/*" onChange={subirFotoGrupo} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ padding: '24px 32px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', marginBottom: '6px' }}>Grupo ADSO — SENA</div>
                  <div style={{ fontSize: '14px', color: '#38bdf8', marginBottom: '14px', fontWeight: '500' }}>Análisis y Desarrollo de Software</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto' }}>Somos un equipo de aprendices del SENA apasionados por la tecnología, el desarrollo de software y la innovación con dispositivos IoT.</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px' }}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '22px', fontWeight: '700', color: '#38bdf8' }}>{miembros.length}</div><div style={{ fontSize: '11px', color: '#64748b' }}>Miembros</div></div>
                    <div style={{ width: '1px', background: '#1e3a5f' }} />
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '22px', fontWeight: '700', color: '#4ade80' }}>🎓</div><div style={{ fontSize: '11px', color: '#64748b' }}>SENA</div></div>
                    <div style={{ width: '1px', background: '#1e3a5f' }} />
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '16px', fontWeight: '700', color: '#a78bfa' }}>3225853</div><div style={{ fontSize: '11px', color: '#64748b' }}>Ficha</div></div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text, marginBottom: '8px', textAlign: 'center' }}>Nuestro equipo</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, textAlign: 'center', marginBottom: '24px' }}>Toca cualquier miembro para editar tu perfil</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {miembros.map((m, i) => (
                  <div key={m.id} style={{ background: theme.card, borderRadius: '20px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: m.foto_url ? 'transparent' : colores[i % colores.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: '#0f172a', flexShrink: 0, overflow: 'hidden' }}>
                        {m.foto_url ? <img src={m.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (m.nombre[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>{m.nombre}</div>
                        <div style={{ fontSize: '13px', color: colores[i % colores.length], fontWeight: '500' }}>{m.rol}</div>
                      </div>
                      <button onClick={() => abrirEdicion(m)} style={{ background: '#f8fafc', border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', color: theme.textMuted }}>✏️ Editar</button>
                    </div>
                    {(m.descripcion || m.correo || m.red_social_url) && (
                      <div style={{ padding: '16px 24px 20px', borderTop: `1px solid ${theme.border}` }}>
                        {m.descripcion && <p style={{ fontSize: '14px', color: theme.textMuted, lineHeight: '1.6', marginBottom: '12px' }}>{m.descripcion}</p>}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {m.correo && <a href={`mailto:${m.correo}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0ea5e9', textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: '20px', border: '1px solid #bfdbfe' }}>📧 {m.correo}</a>}
                          {m.red_social && m.red_social_url && <a href={m.red_social_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#7c3aed', textDecoration: 'none', background: '#f5f3ff', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd6fe' }}>{redesSociales.find(r => r.label === m.red_social)?.icon || '🔗'} {m.red_social}</a>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '32px', background: theme.card, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: theme.textMuted }}>🏫 <strong style={{ color: theme.text }}>SENA</strong> — Servicio Nacional de Aprendizaje<br />Ficha: <strong style={{ color: '#0ea5e9' }}>3225853</strong></div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              🎨 DECORACIÓN — SECCIÓN SOPORTE
          ═══════════════════════════════════════ */}
          {activeSection === 'soporte' && (
            <div style={{ padding: '40px 20px', maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '20px', padding: '32px', textAlign: 'center', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛠</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>Soporte Técnico</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Estamos aquí para ayudarte</div>
              </div>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '28px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '20px' }}>📬 Canales de contacto</div>
                {[
                  { icon: '📧', label: 'Correo soporte', value: 'pelaezkevin63@gmail.com', color: '#0ea5e9' },
                  { icon: '💬', label: 'WhatsApp', value: '+57 3118169181', color: '#22c55e' },
                  { icon: '🕐', label: 'Horario', value: 'Lunes a Viernes 8am - 6pm', color: theme.textMuted },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '22px' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '12px', color: theme.textMuted }}>{item.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: item.color }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '28px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '20px' }}>❓ Preguntas frecuentes</div>
                {faqs.map((faq, i) => (
                  <div key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <div onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', cursor: 'pointer' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: theme.text, flex: 1 }}>{faq.q}</span>
                      <span style={{ fontSize: '18px', color: '#0ea5e9', marginLeft: '12px', transition: 'transform 0.2s', transform: faqOpen === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                    </div>
                    {faqOpen === i && <div style={{ paddingBottom: '14px', fontSize: '13px', color: theme.textMuted, lineHeight: '1.6' }}>{faq.a}</div>}
                  </div>
                ))}
              </div>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '28px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '20px' }}>🟢 Estado del sistema</div>
                {[
                  { label: 'App Web', status: '✅ Operativo' },
                  { label: 'Supabase', status: '✅ Operativo' },
                  { label: 'Broker MQTT', status: mqttStatus },
                  { label: 'Internet', status: httpStatus },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${theme.border}`, fontSize: '14px' }}>
                    <span style={{ color: theme.textMuted }}>{item.label}</span>
                    <span style={{ color: item.status.includes('✅') ? '#22c55e' : '#f59e0b', fontWeight: '500' }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              🎨 DECORACIÓN — SECCIÓN CONFIGURACIÓN
          ═══════════════════════════════════════ */}
          {activeSection === 'config' && (
            <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '32px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '18px', fontWeight: '500', color: theme.text, marginBottom: '24px' }}>Configuración de perfil</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['Nombre', 'Apellido', 'Bio'].map(field => (
                    <div key={field}>
                      <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>{field}</label>
                      <input defaultValue={perfil?.[field.toLowerCase()] || ''} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white', color: theme.text }} />
                    </div>
                  ))}
                  <button style={{ marginTop: '8px', padding: '12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>Guardar cambios</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
      `}</style>
    </div>
  )
}