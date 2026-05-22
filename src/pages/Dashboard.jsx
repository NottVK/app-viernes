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
  const mainRef = useRef(null)

  // ✅ Colores dinámicos según estado del LED
  const theme = {
    bg: ledOn ? '#000000' : '#f8fafc',
    card: ledOn ? '#111111' : '#ffffff',
    border: ledOn ? '#222222' : '#e2e8f0',
    text: ledOn ? '#f1f5f9' : '#0f172a',
    textMuted: ledOn ? '#64748b' : '#94a3b8',
    topbar: ledOn ? 'rgba(0,0,0,0.9)' : 'rgba(248,250,252,0.9)',
    sectionBg: ledOn ? '#050505' : '#f1f5f9',
  }

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

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', background: '#0f172a', transition: 'all 0.5s ease' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
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

      {/* Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '260px', background: ledOn ? '#000000' : '#0f172a', borderRight: `1px solid ${ledOn ? '#222' : '#1e293b'}`, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease, background 0.5s ease', zIndex: 50, display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${ledOn ? '#222' : '#1e293b'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: fotoUrl ? 'transparent' : '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600', color: 'white', overflow: 'hidden', flexShrink: 0 }}>
              {fotoUrl ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciales}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre} {apellido}</div>
              <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: activeSection === item.id ? (ledOn ? '#1a1a1a' : '#1e293b') : 'transparent', borderLeft: activeSection === item.id ? '3px solid #38bdf8' : '3px solid transparent', cursor: 'pointer', fontSize: '14px', color: activeSection === item.id ? '#f1f5f9' : '#94a3b8', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>{item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${ledOn ? '#222' : '#1e293b'}` }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#f87171', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Cerrar sesión</button>
        </div>
      </div>

      {/* Main */}
      <div ref={mainRef} style={{ flex: 1, overflowY: 'auto', background: theme.bg, transition: 'background 0.5s ease' }}>

        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, background: theme.topbar, backdropFilter: 'blur(8px)', borderBottom: `1px solid ${theme.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.5s ease' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px', color: theme.text, padding: '4px 8px', borderRadius: '8px' }}>☰</button>
          <div style={{ fontSize: '16px', fontWeight: '500', color: theme.text, transition: 'color 0.5s ease' }}>{navItems.find(n => n.id === activeSection)?.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>{nombre}</div>
              <div style={{ fontSize: '11px', color: theme.textMuted }}>{user?.email}</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: fotoUrl ? 'transparent' : '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: 'white', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
              {fotoUrl ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciales}
            </div>
          </div>
        </div>

        {/* DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div>
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

            {/* Carrusel */}
            <div style={{ background: '#0f172a', padding: '60px 20px', borderTop: '1px solid #1e293b' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: '600', color: '#f1f5f9' }}>¿Qué puedes hacer?</div>
                <div style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>Desliza para explorar las funciones</div>
              </div>
              <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ background: carruselCards[carruselIndex].bg, borderRadius: '24px', padding: '40px 32px', border: `1px solid ${carruselCards[carruselIndex].color}33`, textAlign: 'center', minHeight: '220px', transition: 'all 0.4s ease', boxShadow: `0 0 40px ${carruselCards[carruselIndex].color}22` }}>
                  <div style={{ fontSize: '56px', marginBottom: '20px' }}>{carruselCards[carruselIndex].icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: carruselCards[carruselIndex].color, marginBottom: '12px' }}>{carruselCards[carruselIndex].title}</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>{carruselCards[carruselIndex].desc}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                  <button onClick={() => setCarruselIndex(i => (i - 1 + carruselCards.length) % carruselCards.length)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>‹</button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {carruselCards.map((_, i) => (
                      <div key={i} onClick={() => setCarruselIndex(i)} style={{ width: i === carruselIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', cursor: 'pointer', background: i === carruselIndex ? carruselCards[carruselIndex].color : '#334155', transition: 'all 0.3s ease' }} />
                    ))}
                  </div>
                  <button onClick={() => setCarruselIndex(i => (i + 1) % carruselCards.length)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>›</button>
                </div>
              </div>
            </div>

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
            {[
              {
                icon: '◈', title: 'Conexión MQTT',
                items: [
                  { label: 'Broker', value: 'HiveMQ Cloud' },
                  { label: 'Estado', value: mqttStatus, color: mqttStatus.includes('✅') ? '#22c55e' : '#f59e0b' },
                  { label: 'Topic publicación', value: 'led/control' },
                  { label: 'Topic suscripción', value: 'led/estado' },
                  { label: 'Puerto', value: '8884 (WSS)' },
                  { label: 'Protocolo', value: 'MQTT over WebSocket' },
                ]
              },
              {
                icon: '🌐', title: 'Conexión HTTP',
                items: [
                  { label: 'Estado internet', value: httpStatus, color: httpStatus.includes('✅') ? '#22c55e' : '#ef4444' },
                  { label: 'Base de datos', value: 'Supabase ✅', color: '#22c55e' },
                  { label: 'Autenticación', value: 'Supabase Auth ✅', color: '#22c55e' },
                  { label: 'Protocolo', value: 'HTTPS / REST API' },
                ]
              }
            ].map(section => (
              <div key={section.title} style={{ background: theme.card, borderRadius: '16px', padding: '32px', border: `1px solid ${theme.border}`, transition: 'all 0.5s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '22px' }}>{section.icon}</span>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text }}>{section.title}</div>
                </div>
                {section.items.map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '14px', color: theme.textMuted }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: item.color || theme.text }}>{item.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* QUIÉNES SOMOS */}
        {activeSection === 'quienes' && (
          <div style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '20px', padding: '40px 32px', textAlign: 'center', marginBottom: '32px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>Grupo ADSO — SENA</div>
              <div style={{ fontSize: '14px', color: '#38bdf8', marginBottom: '16px' }}>Análisis y Desarrollo de Software</div>
              <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto' }}>
                Somos un equipo de aprendices del SENA apasionados por la tecnología, el desarrollo de software y la innovación con dispositivos IoT.
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

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
      `}</style>
    </div>
  )
}