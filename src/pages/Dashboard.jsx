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
  const mainRef = useRef(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
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

  // ✅ Listener MQTT corregido — sin duplicados
  useEffect(() => {
    const handler = (topic, message) => {
      if (topic === 'led/estado') {
        setLedOn(message.toString() === 'ON')
      }
    }
    client.on('message', handler)
    return () => client.off('message', handler)
  }, [])

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
    { id: 'mqtt', icon: '◈', label: 'Conexión MQTT' },
    { id: 'config', icon: '⚙', label: 'Configuración' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', background: '#0f172a' }}>

      {/* Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 40, backdropFilter: 'blur(2px)'
        }} />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed', left: 0, top: 0, height: '100vh',
        width: '260px', background: '#0f172a',
        borderRight: '1px solid #1e293b',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        padding: '24px 0'
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: fotoUrl ? 'transparent' : '#0ea5e9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: '600', color: 'white',
              overflow: 'hidden', flexShrink: 0
            }}>
              {fotoUrl ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciales}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nombre} {apellido}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }} style={{
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px',
              background: activeSection === item.id ? '#1e293b' : 'transparent',
              borderLeft: activeSection === item.id ? '3px solid #38bdf8' : '3px solid transparent',
              cursor: 'pointer', fontSize: '14px',
              color: activeSection === item.id ? '#f1f5f9' : '#94a3b8',
              transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '10px', background: 'transparent',
            color: '#f87171', border: '1px solid #374151',
            borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            transition: 'background 0.2s'
          }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <div ref={mainRef} style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: '22px', color: '#0f172a', padding: '4px 8px', borderRadius: '8px'
          }}>☰</button>

          <div style={{ fontSize: '16px', fontWeight: '500', color: '#0f172a' }}>
            {navItems.find(n => n.id === activeSection)?.label}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{nombre}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user?.email}</div>
            </div>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: fotoUrl ? 'transparent' : '#0ea5e9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '600', color: 'white',
              overflow: 'hidden', cursor: 'pointer', flexShrink: 0
            }}>
              {fotoUrl ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciales}
            </div>
          </div>
        </div>

        {/* DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div>
            <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
              <video autoPlay muted loop playsInline style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: 'brightness(0.4)'
              }}>
                <source src="/hero.mp4" type="video/mp4" />
              </video>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'white', textAlign: 'center', padding: '20px'
              }}>
                <div style={{
                  fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: '700',
                  lineHeight: 1.2, marginBottom: '16px',
                  opacity: Math.max(0, 1 - scrollY / 200),
                  transform: `translateY(${scrollY * 0.3}px)`,
                  transition: 'opacity 0.1s'
                }}>
                  Bienvenido, {nombre} 👋
                </div>
                <div style={{
                  fontSize: 'clamp(14px, 2vw, 18px)', color: '#94a3b8',
                  opacity: Math.max(0, 1 - scrollY / 150),
                  transform: `translateY(${scrollY * 0.2}px)`
                }}>
                  Panel de control IoT — ESP32
                </div>
                <div style={{
                  marginTop: '40px', fontSize: '24px',
                  animation: 'bounce 2s infinite',
                  opacity: Math.max(0, 1 - scrollY / 100)
                }}>↓</div>
              </div>
            </div>

            <div style={{ background: '#0f172a', padding: '80px 20px', color: 'white' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
                <div style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: '600' }}>Estado del sistema</div>
                <div style={{ color: '#94a3b8', marginTop: '8px', fontSize: '15px' }}>Métricas en tiempo real</div>
              </div>

              <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                {[
                  { label: 'Dispositivos activos', value: Math.round(progress2), max: 100, color: '#38bdf8', suffix: '%' },
                  { label: 'Uptime del sistema', value: Math.round(progress), max: 100, color: '#4ade80', suffix: '%' },
                  { label: 'Señal MQTT', value: Math.round(progress3), max: 100, color: '#a78bfa', suffix: '%' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: '#1e293b', borderRadius: '16px', padding: '28px',
                    border: '1px solid #334155',
                    transform: scrollY > 200 ? 'translateY(0)' : 'translateY(40px)',
                    opacity: scrollY > 200 ? 1 : 0,
                    transition: 'all 0.6s ease'
                  }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{stat.label}</div>
                    <div style={{ fontSize: '40px', fontWeight: '700', color: stat.color, marginBottom: '16px' }}>
                      {stat.value}{stat.suffix}
                    </div>
                    <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: stat.color,
                        width: `${stat.value}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Control LED */}
            <div style={{ background: '#f1f5f9', padding: '80px 20px' }}>
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '600', color: '#0f172a' }}>Control del LED</div>
                  <div style={{ color: '#64748b', marginTop: '8px' }}>ESP32 — GPIO 2</div>
                </div>

                <div style={{
                  background: 'white', borderRadius: '24px', padding: '40px',
                  border: '1px solid #e2e8f0', textAlign: 'center',
                  boxShadow: ledOn ? '0 0 40px rgba(56,189,248,0.15)' : 'none',
                  transition: 'box-shadow 0.4s ease'
                }}>
                  <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: ledOn ? '#fef9c3' : '#f1f5f9',
                    margin: '0 auto 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px',
                    transition: 'all 0.4s ease',
                    boxShadow: ledOn ? '0 0 30px #fde047' : 'none'
                  }}>💡</div>

                  <div style={{ fontSize: '18px', fontWeight: '500', color: ledOn ? '#ca8a04' : '#94a3b8', marginBottom: '32px' }}>
                    {ledOn ? 'Encendido' : 'Apagado'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>OFF</span>
                    <div onClick={handleToggle} style={{
                      width: '72px', height: '36px',
                      background: ledOn ? '#38bdf8' : '#cbd5e1',
                      borderRadius: '18px', cursor: 'pointer',
                      position: 'relative', transition: 'background 0.3s ease'
                    }}>
                      <div style={{
                        width: '28px', height: '28px',
                        background: 'white', borderRadius: '50%',
                        position: 'absolute', top: '4px',
                        left: ledOn ? '40px' : '4px',
                        transition: 'left 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    </div>
                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>ON</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MQTT */}
        {activeSection === 'mqtt' && (
          <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '18px', fontWeight: '500', color: '#0f172a', marginBottom: '24px' }}>Conexión MQTT</div>
              {[
                { label: 'Broker', value: 'HiveMQ Cloud' },
                { label: 'Estado', value: 'Conectado ✅', color: '#22c55e' },
                { label: 'Topic publicación', value: 'led/control' },
                { label: 'Topic suscripción', value: 'led/estado' },
                { label: 'Puerto', value: '8884 (WSS)' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0', borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>{item.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: item.color || '#0f172a' }}>{item.value}</span>
                </div>
              ))}
              <div style={{ marginTop: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                ESP32 escucha en "led/control" y responde en "led/estado"
              </div>
            </div>
          </div>
        )}

        {/* CONFIG */}
        {activeSection === 'config' && (
          <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '18px', fontWeight: '500', color: '#0f172a', marginBottom: '24px' }}>Configuración</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Nombre', 'Apellido', 'Bio'].map(field => (
                  <div key={field}>
                    <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>{field}</label>
                    <input
                      defaultValue={perfil?.[field.toLowerCase()] || ''}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        border: '1px solid #e2e8f0', fontSize: '14px',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
                <button style={{
                  marginTop: '8px', padding: '12px', background: '#0ea5e9',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '14px', cursor: 'pointer', fontWeight: '500'
                }}>
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