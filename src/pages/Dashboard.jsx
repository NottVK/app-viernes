import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { client } from '../mqtt'

export default function Dashboard() {
  const navigate = useNavigate()
  const [ledOn, setLedOn] = useState(false)
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [scrollY, setScrollY] = useState(0)
  const [carruselIndex, setCarruselIndex] = useState(0)
  const [mqttStatus, setMqttStatus] = useState('Conectando...')
  const [httpStatus, setHttpStatus] = useState('Verificando...')
  const [miembros, setMiembros] = useState([])
  const [editandoMiembro, setEditandoMiembro] = useState(null)
  const [editForm, setEditForm] = useState({ nombre: '', rol: '', foto_url: '', descripcion: '', correo: '', red_social: '', red_social_url: '' })
  const [guardando, setGuardando] = useState(false)
  const [faqOpen, setFaqOpen] = useState(null)
  const [grupoFotoUrl, setGrupoFotoUrl] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [ledOnCount, setLedOnCount] = useState(0)
  const [ledOffCount, setLedOffCount] = useState(0)
  const mainRef = useRef(null)
  const mqttChartRef = useRef(null)
  const httpChartRef = useRef(null)
  const ledChartRef = useRef(null)
  const mqttChartInst = useRef(null)
  const httpChartInst = useRef(null)
  const ledChartInst = useRef(null)
  const chartsInterval = useRef(null)

  const theme = {
    bg: ledOn ? '#000000' : '#f8fafc',
    card: ledOn ? '#111111' : '#ffffff',
    border: ledOn ? '#222222' : '#e2e8f0',
    text: ledOn ? '#f1f5f9' : '#0f172a',
    textMuted: ledOn ? '#64748b' : '#94a3b8',
    topbar: ledOn ? 'rgba(0,0,0,0.95)' : 'rgba(248,250,252,0.95)',
    sectionBg: ledOn ? '#050505' : '#f1f5f9',
    sidebar: ledOn ? '#0a0a0a' : '#0f172a',
  }

  // ---- ESTADOS PARA CONFIGURACIÓN DE CONEXIÓN ----
  const [editandoMqtt, setEditandoMqtt] = useState(false)
  const [editandoHttp, setEditandoHttp] = useState(false)
  const [mqttConfig, setMqttConfig] = useState(() => {
    const saved = localStorage.getItem('mqttConfig')
    return saved ? JSON.parse(saved) : {
      host: 'broker.hivemq.cloud',
      port: '8884',
      user: import.meta.env.VITE_MQTT_USER || '',
      pass: import.meta.env.VITE_MQTT_PASS || '',
      protocol: 'wss',
    }
  })
  const [httpConfig, setHttpConfig] = useState(() => {
    const saved = localStorage.getItem('httpConfig')
    return saved ? JSON.parse(saved) : {
      baseUrl: 'https://YOUR-PROJECT.supabase.co',
      apiKey: import.meta.env.VITE_SUPABASE_KEY || '',
      service: 'supabase',
    }
  })
  const [tempMqttConfig, setTempMqttConfig] = useState(mqttConfig)
  const [tempHttpConfig, setTempHttpConfig] = useState(httpConfig)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  useEffect(() => {
    const { data } = supabase.storage.from('grupo').getPublicUrl('foto_grupo.jpg')
    if (data?.publicUrl) setGrupoFotoUrl(data.publicUrl)
  }, [])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const handleScroll = () => setScrollY(el.scrollTop)
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (client.connected) setMqttStatus('Conectado ✅')
    const handler = (topic, message) => {
      if (topic === 'led/estado') setLedOn(message.toString() === 'ON')
    }
    const onConnect = () => setMqttStatus('Conectado ✅')
    const onError = () => setMqttStatus('Error ❌')
    const onOffline = () => setMqttStatus('Desconectado ⚠️')
    client.on('message', handler)
    client.on('connect', onConnect)
    client.on('error', onError)
    client.on('offline', onOffline)
    return () => {
      client.off('message', handler)
      client.off('connect', onConnect)
      client.off('error', onError)
      client.off('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
      .then(() => setHttpStatus('Conectado ✅'))
      .catch(() => setHttpStatus('Sin conexión ❌'))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCarruselIndex(i => (i + 1) % carruselCards.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => { cargarMiembros() }, [])

  // ---- Inicializar gráficas Chart.js ----
  useEffect(() => {
    if (!mqttChartRef.current || !httpChartRef.current || !ledChartRef.current) return

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables)

      const rnd = (base, v) =>
        Array.from({ length: 11 }, () => Math.round(base + (Math.random() - 0.5) * v))
      const timeLabels = Array.from({ length: 11 }, (_, i) => `${i * 30}s`)

      // MQTT chart
      if (mqttChartInst.current) mqttChartInst.current.destroy()
      mqttChartInst.current = new Chart(mqttChartRef.current, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [
            {
              label: 'Publicados',
              data: rnd(18, 12),
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56,189,248,0.08)',
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointBackgroundColor: '#38bdf8',
              borderWidth: 2,
            },
            {
              label: 'Recibidos',
              data: rnd(14, 10),
              borderColor: '#818cf8',
              backgroundColor: 'rgba(129,140,248,0.06)',
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointBackgroundColor: '#818cf8',
              borderDash: [4, 3],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: '#64748b', font: { size: 10 }, autoSkip: true, maxRotation: 0 },
              grid: { color: 'rgba(51,65,85,0.5)' },
            },
            y: {
              ticks: { color: '#64748b', font: { size: 10 } },
              grid: { color: 'rgba(51,65,85,0.5)' },
              beginAtZero: true,
            },
          },
        },
      })

      // HTTP chart
      if (httpChartInst.current) httpChartInst.current.destroy()
      httpChartInst.current = new Chart(httpChartRef.current, {
        type: 'bar',
        data: {
          labels: timeLabels,
          datasets: [
            {
              label: 'Supabase REST',
              data: rnd(24, 16),
              backgroundColor: 'rgba(74,222,128,0.75)',
              borderRadius: 4,
            },
            {
              label: 'Auth requests',
              data: rnd(8, 6),
              backgroundColor: 'rgba(253,224,71,0.7)',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              stacked: true,
              ticks: { color: '#64748b', font: { size: 10 }, autoSkip: true, maxRotation: 0 },
              grid: { color: 'rgba(51,65,85,0.5)' },
            },
            y: {
              stacked: true,
              ticks: { color: '#64748b', font: { size: 10 } },
              grid: { color: 'rgba(51,65,85,0.5)' },
              beginAtZero: true,
            },
          },
        },
      })

      // LED doughnut
      if (ledChartInst.current) ledChartInst.current.destroy()
      ledChartInst.current = new Chart(ledChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Encendidos', 'Apagados'],
          datasets: [
            {
              data: [0, 1],
              backgroundColor: ['#fde047', '#334155'],
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: { legend: { display: false } },
        },
      })

      // Animación de tráfico en tiempo real
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
    }
  }, [])

  // Actualizar gráfica LED cuando cambian los contadores
  useEffect(() => {
    if (ledChartInst.current) {
      ledChartInst.current.data.datasets[0].data = [
        ledOnCount,
        Math.max(ledOffCount, ledOnCount === 0 ? 1 : 0),
      ]
      ledChartInst.current.update()
    }
  }, [ledOnCount, ledOffCount])

  const cargarMiembros = async () => {
    const { data } = await supabase.from('miembros').select('*').order('orden')
    if (data) setMiembros(data)
  }

  const abrirEdicion = (m) => {
    setEditandoMiembro(m.id)
    setEditForm({
      nombre: m.nombre || '',
      rol: m.rol || '',
      foto_url: m.foto_url || '',
      descripcion: m.descripcion || '',
      correo: m.correo || '',
      red_social: m.red_social || '',
      red_social_url: m.red_social_url || '',
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
    const ext = file.name.split('.').pop()
    const fileName = `foto_grupo.${ext}`
    const { error } = await supabase.storage.from('grupo').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('grupo').getPublicUrl(fileName)
      setGrupoFotoUrl(data.publicUrl + '?t=' + Date.now())
    }
  }

  const guardarMiembro = async () => {
    setGuardando(true)
    await supabase.from('miembros').update({
      nombre: editForm.nombre,
      rol: editForm.rol,
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleToggle = () => {
    const newState = !ledOn
    setLedOn(newState)
    client.publish('led/control', newState ? 'ON' : 'OFF')
    if (newState) setLedOnCount(c => c + 1)
    else setLedOffCount(c => c + 1)
  }

  const guardarMqttConfig = () => {
    localStorage.setItem('mqttConfig', JSON.stringify(tempMqttConfig))
    setMqttConfig(tempMqttConfig)
    setEditandoMqtt(false)
    alert('✅ Configuración MQTT guardada. Reinicia la app para aplicar cambios.')
  }

  const guardarHttpConfig = () => {
    localStorage.setItem('httpConfig', JSON.stringify(tempHttpConfig))
    setHttpConfig(tempHttpConfig)
    setEditandoHttp(false)
    alert('✅ Configuración HTTP guardada. Reinicia la app para aplicar cambios.')
  }

  const nombre = perfil?.nombre || user?.email?.split('@')[0] || 'Usuario'
  const apellido = perfil?.apellido || ''
  const iniciales = (nombre[0] + (apellido[0] || nombre[1] || '')).toUpperCase()
  const fotoUrl = perfil?.foto_url

  const progress = Math.min(scrollY / 3, 100)
  const progress2 = Math.min(scrollY / 5, 100)
  const progress3 = Math.min(scrollY / 4, 100)

  const navItems = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'mqtt', icon: '◈', label: 'Conexión' },
    { id: 'quienes', icon: '👥', label: 'Quiénes somos' },
    { id: 'soporte', icon: '🛠', label: 'Soporte' },
    { id: 'config', icon: '⚙', label: 'Configuración' },
  ]

  const carruselCards = [
    { icon: '💡', title: 'Control inteligente', desc: 'Enciende y apaga dispositivos desde cualquier lugar del mundo en tiempo real.', color: '#fde047', bg: '#1e293b' },
    { icon: '📡', title: 'Conectado siempre', desc: 'Tu ESP32 permanece conectado al broker MQTT para recibir órdenes al instante.', color: '#38bdf8', bg: '#0f2744' },
    { icon: '🔒', title: 'Seguro y privado', desc: 'Autenticación con Supabase y comunicación cifrada WSS para proteger tus datos.', color: '#4ade80', bg: '#0f2918' },
    { icon: '📱', title: 'App móvil nativa', desc: 'Disponible como APK para Android con acceso a cámara, ubicación y más.', color: '#a78bfa', bg: '#1a1040' },
    { icon: '⚡', title: 'Automatización IoT', desc: 'Integra sensores, relés y actuadores para crear un hogar o laboratorio inteligente.', color: '#fb923c', bg: '#2d1200' },
  ]

  const faqs = [
    { q: '¿Cómo conecto el ESP32?', a: 'Carga el código Arduino con tus credenciales WiFi y HiveMQ, conecta el relé al GPIO 2 y enciéndelo.' },
    { q: '¿Qué pasa si se va la luz?', a: 'El ESP32 se reconecta automáticamente al WiFi y al broker MQTT al recuperar energía.' },
    { q: '¿Puedo controlar más de un dispositivo?', a: 'Sí, puedes agregar más topics MQTT y más toggles en el dashboard para múltiples dispositivos.' },
    { q: '¿La app funciona sin internet?', a: 'No, necesitas conexión a internet para comunicarte con el broker HiveMQ Cloud.' },
    { q: '¿Cómo cambio mi contraseña?', a: 'Ve a la pantalla de login y usa la opción "¿Olvidaste tu contraseña?" para restablecerla.' },
  ]

  const colores = ['#38bdf8', '#4ade80', '#a78bfa', '#fb923c', '#f472b6', '#fde047']

  const redesSociales = [
    { label: 'Instagram', icon: '📸' },
    { label: 'LinkedIn', icon: '💼' },
    { label: 'GitHub', icon: '🐙' },
    { label: 'Twitter/X', icon: '🐦' },
    { label: 'Facebook', icon: '👤' },
    { label: 'TikTok', icon: '🎵' },
  ]

  const SIDEBAR_WIDTH = 260

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', background: theme.sidebar, transition: 'all 0.5s ease' }}>

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Modal editar miembro */}
      {editandoMiembro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', margin: 'auto' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '24px' }}>✏️ Editar mi perfil</div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 12px', background: editForm.foto_url ? 'transparent' : '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#0f172a', overflow: 'hidden' }}>
                {editForm.foto_url
                  ? <img src={editForm.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setEditForm(f => ({ ...f, foto_url: '' }))} />
                  : (editForm.nombre[0] || '?').toUpperCase()}
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

      {/* ======= SIDEBAR ======= */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        left: 0,
        top: 0,
        height: '100vh',
        width: `${SIDEBAR_WIDTH}px`,
        flexShrink: 0,
        background: theme.sidebar,
        borderRight: `1px solid ${ledOn ? '#1a1a1a' : '#1e293b'}`,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform 0.3s ease, background 0.5s ease',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
      }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${ledOn ? '#1a1a1a' : '#1e293b'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>⚡</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '0.5px' }}>IoT Dashboard</div>
            <div style={{ fontSize: '11px', color: '#38bdf8' }}>ESP32 Control</div>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${ledOn ? '#1a1a1a' : '#1e293b'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: fotoUrl ? 'transparent' : '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '600', color: 'white', overflow: 'hidden', flexShrink: 0 }}>
            {fotoUrl ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciales}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre} {apellido}</div>
            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#475569', letterSpacing: '1px', padding: '8px 20px 4px', textTransform: 'uppercase' }}>Menú</div>
          {navItems.map(item => (
            <div
              key={item.id}
              onClick={() => { setActiveSection(item.id); if (isMobile) setSidebarOpen(false) }}
              style={{
                padding: '10px 20px',
                margin: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: activeSection === item.id ? 'linear-gradient(90deg, #0ea5e920, #6366f110)' : 'transparent',
                borderRadius: '10px',
                borderLeft: activeSection === item.id ? '3px solid #38bdf8' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: activeSection === item.id ? '#f1f5f9' : '#64748b',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              {activeSection === item.id && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />}
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 20px', borderTop: `1px solid ${ledOn ? '#1a1a1a' : '#1e293b'}`, borderBottom: `1px solid ${ledOn ? '#1a1a1a' : '#1e293b'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>LED GPIO 2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ledOn ? '#4ade80' : '#475569', boxShadow: ledOn ? '0 0 6px #4ade80' : 'none', transition: 'all 0.3s' }} />
              <span style={{ fontSize: '11px', color: ledOn ? '#4ade80' : '#475569', fontWeight: '500' }}>{ledOn ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '9px', background: 'transparent', color: '#f87171', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>⎋</span> Cerrar sesión
          </button>
        </div>
      </div>

      {/* ======= MAIN CONTENT ======= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          flexShrink: 0,
          background: theme.topbar,
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${theme.border}`,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.5s ease',
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px', color: theme.text, padding: '4px 8px', borderRadius: '8px' }}>☰</button>
            )}
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: theme.text, transition: 'color 0.5s ease' }}>
                {navItems.find(n => n.id === activeSection)?.label}
              </div>
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

        {/* Scrollable content */}
        <div ref={mainRef} style={{ flex: 1, overflowY: 'auto', background: theme.bg, transition: 'background 0.5s ease' }}>

          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div>
              {/* Hero video */}
              <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
                <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }}>
                  <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
                </video>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: '700', lineHeight: 1.2, marginBottom: '16px', opacity: Math.max(0, 1 - scrollY / 200), transform: `translateY(${scrollY * 0.3}px)` }}>
                    Bienvenido, {nombre} 👋
                  </div>
                  <div style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: '#94a3b8', opacity: Math.max(0, 1 - scrollY / 150), transform: `translateY(${scrollY * 0.2}px)` }}>
                    Panel de control IoT — ESP32
                  </div>
                  <div style={{ marginTop: '40px', fontSize: '24px', animation: 'bounce 2s infinite', opacity: Math.max(0, 1 - scrollY / 100) }}>↓</div>
                </div>
              </div>

              {/* ===== BLOQUE GRÁFICAS + LED + CARRUSEL ===== */}
              <div style={{ background: '#0f172a', padding: '60px 20px', borderTop: '1px solid #1e293b' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '600', color: '#f1f5f9' }}>
                    Tráfico de red en tiempo real
                  </div>
                  <div style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
                    Simulación hipotética — MQTT · HTTP · LED
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0,1fr))',
                  gap: '24px',
                  maxWidth: '900px',
                  margin: '0 auto',
                }}>

                  {/* Fila 1, Col 1 — Gráfica MQTT */}
                  <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Protocolo MQTT</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '14px' }}>Mensajes / min</div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#38bdf8' }} />
                        Publicados
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#818cf8', border: '1px dashed #818cf8' }} />
                        Recibidos
                      </span>
                    </div>
                    <div style={{ position: 'relative', height: '180px' }}>
                      <canvas ref={mqttChartRef} />
                    </div>
                  </div>

                  {/* Fila 1, Col 2 — Gráfica HTTP */}
                  <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Protocolo HTTP</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '14px' }}>Solicitudes / min</div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#4ade80' }} />
                        Supabase REST
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#fde047' }} />
                        Auth requests
                      </span>
                    </div>
                    <div style={{ position: 'relative', height: '180px' }}>
                      <canvas ref={httpChartRef} />
                    </div>
                  </div>

                  {/* Fila 2, Col 1 — Gráfica circular LED */}
                  <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Activaciones LED</div>
                      <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                        <canvas ref={ledChartRef} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <span style={{ fontSize: '28px', fontWeight: '700', color: '#fde047', lineHeight: 1 }}>{ledOnCount}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>encendidos</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '110px' }}>
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Estado actual</div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: ledOn ? '#1a2a1a' : 'transparent',
                          border: `1px solid ${ledOn ? '#166534' : '#374151'}`,
                          borderRadius: '20px', padding: '4px 12px',
                          transition: 'all 0.3s',
                        }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ledOn ? '#4ade80' : '#475569', transition: 'background 0.3s' }} />
                          <span style={{ fontSize: '12px', color: ledOn ? '#4ade80' : '#475569', fontWeight: '500' }}>{ledOn ? 'ON' : 'OFF'}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                        Apagados: <span style={{ color: '#f1f5f9', fontWeight: '600' }}>{ledOffCount}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#fde047' }} />
                          Encendidos: {ledOnCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fila 2, Col 2 — Carrusel */}
                  <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
                    <div style={{
                      background: carruselCards[carruselIndex].bg,
                      borderRadius: '14px',
                      padding: '28px 20px',
                      border: `1px solid ${carruselCards[carruselIndex].color}33`,
                      textAlign: 'center',
                      minHeight: '165px',
                      transition: 'all 0.4s ease',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: '42px', marginBottom: '12px' }}>{carruselCards[carruselIndex].icon}</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: carruselCards[carruselIndex].color, marginBottom: '8px' }}>{carruselCards[carruselIndex].title}</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{carruselCards[carruselIndex].desc}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
                      <button onClick={() => setCarruselIndex(i => (i - 1 + carruselCards.length) % carruselCards.length)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {carruselCards.map((_, i) => (
                          <div key={i} onClick={() => setCarruselIndex(i)} style={{ width: i === carruselIndex ? '18px' : '7px', height: '7px', borderRadius: '4px', cursor: 'pointer', background: i === carruselIndex ? carruselCards[carruselIndex].color : '#334155', transition: 'all 0.3s ease' }} />
                        ))}
                      </div>
                      <button onClick={() => setCarruselIndex(i => (i + 1) % carruselCards.length)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                    </div>
                  </div>

                </div>
              </div>
              {/* ===== FIN BLOQUE GRÁFICAS ===== */}

              {/* Stats */}
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
                      <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                        <div style={{ height: '100%', borderRadius: '3px', background: stat.color, width: `${stat.value}%`, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Control LED */}
              <div style={{ background: theme.sectionBg, padding: '80px 20px', transition: 'background 0.5s ease' }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '600', color: theme.text }}>Control del LED</div>
                    <div style={{ color: theme.textMuted, marginTop: '8px' }}>ESP32 — GPIO 2</div>
                  </div>
                  <div style={{ background: theme.card, borderRadius: '24px', padding: '40px', border: `1px solid ${theme.border}`, textAlign: 'center', boxShadow: ledOn ? '0 0 60px rgba(253,224,71,0.3)' : 'none', transition: 'all 0.5s ease' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: ledOn ? '#fef9c3' : '#f1f5f9', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', transition: 'all 0.4s ease', boxShadow: ledOn ? '0 0 40px #fde047, 0 0 80px #fde04744' : 'none' }}>💡</div>
                    <div style={{ fontSize: '18px', fontWeight: '500', color: ledOn ? '#ca8a04' : theme.textMuted, marginBottom: '32px' }}>{ledOn ? 'Encendido' : 'Apagado'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '14px', color: theme.textMuted }}>OFF</span>
                      <div onClick={handleToggle} style={{ width: '72px', height: '36px', background: ledOn ? '#38bdf8' : '#cbd5e1', borderRadius: '18px', cursor: 'pointer', position: 'relative', transition: 'background 0.3s ease' }}>
                        <div style={{ width: '28px', height: '28px', background: 'white', borderRadius: '50%', position: 'absolute', top: '4px', left: ledOn ? '40px' : '4px', transition: 'left 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                      </div>
                      <span style={{ fontSize: '14px', color: theme.textMuted }}>ON</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

       {/* CONEXIÓN */}
{activeSection === 'mqtt' && (
  <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

    {/* ── MQTT ── */}
    <div style={{ background: theme.card, borderRadius: '16px', padding: '32px', border: `1px solid ${theme.border}`, transition: 'all 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>◈</span>
          <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text }}>Conexión MQTT</div>
        </div>
        <button onClick={() => setEditandoMqtt(true)} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>✏️ Editar</button>
      </div>

      <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Broker activo</div>
      <div style={{ background: ledOn ? '#0a1628' : '#eff6ff', border: '2px solid #0ea5e9', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>☁️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>{mqttConfig.host}</div>
              <div style={{ fontSize: '12px', color: theme.textMuted }}>Puerto {mqttConfig.port} · {mqttConfig.protocol.toUpperCase()}</div>
            </div>
          </div>
          <span style={{ fontSize: '12px', background: '#14532d22', border: '1px solid #166534', color: '#22c55e', padding: '3px 10px', borderRadius: '20px' }}>
            {mqttStatus}
          </span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Detalles</div>
        {[
          { label: 'Host', value: mqttConfig.host },
          { label: 'Puerto', value: mqttConfig.port },
          { label: 'Usuario', value: mqttConfig.user ? mqttConfig.user.substring(0, 3) + '...' : 'No configurado' },
          { label: 'Protocolo', value: mqttConfig.protocol.toUpperCase() },
          { label: 'Topic publicación', value: 'led/control' },
          { label: 'Topic suscripción', value: 'led/estado' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: '14px', color: theme.textMuted }}>{item.label}</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>

    {/* ── HTTP ── */}
    <div style={{ background: theme.card, borderRadius: '16px', padding: '32px', border: `1px solid ${theme.border}`, transition: 'all 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🌐</span>
          <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text }}>Conexión HTTP</div>
        </div>
        <button onClick={() => setEditandoHttp(true)} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>✏️ Editar</button>
      </div>

      <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Base de datos activa</div>
      <div style={{ background: ledOn ? '#0a1628' : '#eff6ff', border: '2px solid #0ea5e9', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🗄️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>{httpConfig.service === 'supabase' ? 'Supabase' : 'API Personalizada'}</div>
              <div style={{ fontSize: '12px', color: theme.textMuted }}>REST API · {httpConfig.baseUrl.includes('supabase') ? 'Auth incluido' : 'Endpoint propio'}</div>
            </div>
          </div>
          <span style={{ fontSize: '12px', background: '#14532d22', border: '1px solid #166534', color: '#22c55e', padding: '3px 10px', borderRadius: '20px' }}>
            {httpStatus}
          </span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Estado</div>
        {[
          { label: 'Internet', value: httpStatus, color: httpStatus.includes('✅') ? '#22c55e' : '#ef4444' },
          { label: 'Base de datos', value: httpConfig.service === 'supabase' ? 'Supabase ✅' : 'Personalizada', color: '#22c55e' },
          { label: 'URL Base', value: httpConfig.baseUrl.substring(0, 25) + '...', color: theme.text },
          { label: 'Protocolo', value: 'HTTPS / REST API' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: '14px', color: theme.textMuted }}>{item.label}</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: item.color || theme.text }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>

  </div>
)}

          {/* MODAL EDITAR MQTT */}
          {editandoMqtt && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
              <div style={{ background: theme.card, borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', margin: 'auto', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text, marginBottom: '24px' }}>⚙️ Configurar MQTT</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Host del broker', key: 'host', placeholder: 'broker.hivemq.cloud' },
                    { label: 'Puerto', key: 'port', placeholder: '8884', type: 'number' },
                    { label: 'Usuario', key: 'user', placeholder: 'usuario' },
                    { label: 'Contraseña', key: 'pass', placeholder: 'contraseña', type: 'password' },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>{field.label}</label>
                      <input 
                        type={field.type || 'text'}
                        value={tempMqttConfig[field.key]} 
                        onChange={e => setTempMqttConfig(c => ({ ...c, [field.key]: e.target.value }))} 
                        placeholder={field.placeholder} 
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: theme.card, color: theme.text, transition: 'all 0.5s ease' }} 
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>Protocolo</label>
                    <select 
                      value={tempMqttConfig.protocol}
                      onChange={e => setTempMqttConfig(c => ({ ...c, protocol: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: theme.card, color: theme.text }}
                    >
                      <option value="wss">WSS (Seguro - WebSocket)</option>
                      <option value="ws">WS (WebSocket)</option>
                      <option value="mqtt">MQTT (TCP)</option>
                      <option value="mqtts">MQTTS (TCP Seguro)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button 
                      onClick={() => {
                        setEditandoMqtt(false)
                        setTempMqttConfig(mqttConfig)
                      }} 
                      style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: theme.textMuted }}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={guardarMqttConfig} 
                      style={{ flex: 1, padding: '12px', background: '#0ea5e9', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: 'white', fontWeight: '500' }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL EDITAR HTTP */}
          {editandoHttp && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
              <div style={{ background: theme.card, borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', margin: 'auto', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text, marginBottom: '24px' }}>⚙️ Configurar HTTP</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>Servicio</label>
                    <select 
                      value={tempHttpConfig.service}
                      onChange={e => setTempHttpConfig(c => ({ ...c, service: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: theme.card, color: theme.text }}
                    >
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
                      <input 
                        type={field.type || 'text'}
                        value={tempHttpConfig[field.key]} 
                        onChange={e => setTempHttpConfig(c => ({ ...c, [field.key]: e.target.value }))} 
                        placeholder={field.placeholder} 
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: theme.card, color: theme.text, transition: 'all 0.5s ease' }} 
                      />
                    </div>
                  ))}
                  <div style={{ background: theme.sectionBg, padding: '12px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: '12px', color: theme.textMuted, lineHeight: '1.6' }}>
                      ⚠️ <strong>Importante:</strong> La configuración se guarda localmente. Reinicia la app para aplicar cambios.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button 
                      onClick={() => {
                        setEditandoHttp(false)
                        setTempHttpConfig(httpConfig)
                      }} 
                      style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: theme.textMuted }}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={guardarHttpConfig} 
                      style={{ flex: 1, padding: '12px', background: '#0ea5e9', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: 'white', fontWeight: '500' }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'quienes' && (
            <div style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
              <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '20px', overflow: 'hidden', marginBottom: '32px', border: '1px solid #1e4080' }}>
                <div style={{ position: 'relative', width: '100%', height: '200px', background: grupoFotoUrl ? 'transparent' : 'linear-gradient(135deg, #0c2340, #1a4a8a)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {grupoFotoUrl ? (
                    <img src={grupoFotoUrl} alt="Foto del grupo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setGrupoFotoUrl(null)} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.4 }}>📸</div>
                      <div style={{ fontSize: '13px', opacity: 0.5 }}>Foto del grupo</div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0f172a 100%)' }} />
                  <label style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(14,165,233,0.9)', color: 'white', fontSize: '12px', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', zIndex: 2 }}>
                    📷 {grupoFotoUrl ? 'Cambiar foto' : 'Subir foto'}
                    <input type="file" accept="image/*" onChange={subirFotoGrupo} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ padding: '24px 32px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', marginBottom: '6px' }}>Grupo ADSO — SENA</div>
                  <div style={{ fontSize: '14px', color: '#38bdf8', marginBottom: '14px', fontWeight: '500' }}>Análisis y Desarrollo de Software</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto' }}>
                    Somos un equipo de aprendices del SENA apasionados por la tecnología, el desarrollo de software y la innovación con dispositivos IoT.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#38bdf8' }}>{miembros.length}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Miembros</div>
                    </div>
                    <div style={{ width: '1px', background: '#1e3a5f' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#4ade80' }}>🎓</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>SENA</div>
                    </div>
                    <div style={{ width: '1px', background: '#1e3a5f' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#a78bfa' }}>3225853</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Ficha</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text, marginBottom: '8px', textAlign: 'center', transition: 'color 0.5s ease' }}>Nuestro equipo</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, textAlign: 'center', marginBottom: '24px' }}>Toca cualquier miembro para editar tu perfil</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {miembros.map((m, i) => (
                  <div key={m.id} style={{ background: theme.card, borderRadius: '20px', border: `1px solid ${theme.border}`, overflow: 'hidden', transition: 'all 0.5s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: m.foto_url ? 'transparent' : colores[i % colores.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: '#0f172a', flexShrink: 0, overflow: 'hidden' }}>
                        {m.foto_url ? <img src={m.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (m.nombre[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>{m.nombre}</div>
                        <div style={{ fontSize: '13px', color: colores[i % colores.length], fontWeight: '500' }}>{m.rol}</div>
                      </div>
                      <button onClick={() => abrirEdicion(m)} style={{ background: ledOn ? '#1a1a1a' : '#f8fafc', border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', color: theme.textMuted }}>✏️ Editar</button>
                    </div>
                    {(m.descripcion || m.correo || m.red_social_url) && (
                      <div style={{ padding: '16px 24px 20px', borderTop: `1px solid ${theme.border}` }}>
                        {m.descripcion && <p style={{ fontSize: '14px', color: theme.textMuted, lineHeight: '1.6', marginBottom: '12px' }}>{m.descripcion}</p>}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {m.correo && (
                            <a href={`mailto:${m.correo}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0ea5e9', textDecoration: 'none', background: ledOn ? '#0a1628' : '#eff6ff', padding: '6px 12px', borderRadius: '20px', border: '1px solid #bfdbfe' }}>
                              📧 {m.correo}
                            </a>
                          )}
                          {m.red_social && m.red_social_url && (
                            <a href={m.red_social_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#7c3aed', textDecoration: 'none', background: ledOn ? '#0f0a1e' : '#f5f3ff', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd6fe' }}>
                              {redesSociales.find(r => r.label === m.red_social)?.icon || '🔗'} {m.red_social}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '32px', background: theme.card, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}`, textAlign: 'center', transition: 'all 0.5s ease' }}>
                <div style={{ fontSize: '13px', color: theme.textMuted }}>
                  🏫 <strong style={{ color: theme.text }}>SENA</strong> — Servicio Nacional de Aprendizaje<br />
                  Ficha: <strong style={{ color: '#0ea5e9' }}>3225853</strong>
                </div>
              </div>
            </div>
          )}

          {/* SOPORTE */}
          {activeSection === 'soporte' && (
            <div style={{ padding: '40px 20px', maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '20px', padding: '32px', textAlign: 'center', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛠</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>Soporte Técnico</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Estamos aquí para ayudarte</div>
              </div>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '28px', border: `1px solid ${theme.border}`, transition: 'all 0.5s ease' }}>
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
              <div style={{ background: theme.card, borderRadius: '16px', padding: '28px', border: `1px solid ${theme.border}`, transition: 'all 0.5s ease' }}>
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
              <div style={{ background: theme.card, borderRadius: '16px', padding: '28px', border: `1px solid ${theme.border}`, transition: 'all 0.5s ease' }}>
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

          {/* CONFIG */}
          {activeSection === 'config' && (
            <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ background: theme.card, borderRadius: '16px', padding: '32px', border: `1px solid ${theme.border}`, transition: 'all 0.5s ease' }}>
                <div style={{ fontSize: '18px', fontWeight: '500', color: theme.text, marginBottom: '24px' }}>Configuración de perfil</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['Nombre', 'Apellido', 'Bio'].map(field => (
                    <div key={field}>
                      <label style={{ fontSize: '13px', color: theme.textMuted, display: 'block', marginBottom: '6px' }}>{field}</label>
                      <input defaultValue={perfil?.[field.toLowerCase()] || ''} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: ledOn ? '#1a1a1a' : 'white', color: theme.text, transition: 'all 0.5s ease' }} />
                    </div>
                  ))}
                  <button style={{ marginTop: '8px', padding: '12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                    Guardar cambios
                  </button>
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