import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [ledOn, setLedOn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleToggle = async () => {
    setLoading(true)
    const newState = !ledOn
    setLedOn(newState)
    // Aquí después conectarás MQTT
    // mqtt.publish('led/control', newState ? 'ON' : 'OFF')
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 24px 32px' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#38bdf8' }}>IoT Panel</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Control de dispositivos</div>
        </div>

        <nav style={{ flex: 1 }}>
          {[
            { icon: '⊞', label: 'Dashboard', active: true },
            { icon: '◉', label: 'Dispositivos', active: false },
            { icon: '≡', label: 'Historial', active: false },
            { icon: '⚙', label: 'Configuración', active: false },
          ].map(item => (
            <div key={item.label} style={{
              padding: '12px 24px',
              display: 'flex', alignItems: 'center', gap: '12px',
              background: item.active ? '#1e293b' : 'transparent',
              borderLeft: item.active ? '3px solid #38bdf8' : '3px solid transparent',
              cursor: 'pointer', fontSize: '14px',
              color: item.active ? '#f1f5f9' : '#94a3b8'
            }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '0 24px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', background: '#1e293b',
            color: '#f87171', border: '1px solid #374151',
            borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
          }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, background: '#f1f5f9', padding: '32px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>Control en tiempo real de tus dispositivos</p>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Dispositivos', value: '1', color: '#38bdf8' },
            { label: 'Estado LED', value: ledOn ? 'ON' : 'OFF', color: ledOn ? '#4ade80' : '#f87171' },
            { label: 'Conexión', value: 'Activa', color: '#4ade80' },
          ].map(card => (
            <div key={card.label} style={{
              background: 'white', borderRadius: '12px',
              padding: '20px', border: '0.5px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>{card.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '500', color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Control del LED */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '32px', border: '0.5px solid #e2e8f0',
          maxWidth: '400px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#0f172a', marginBottom: '4px' }}>Control del LED</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '32px' }}>ESP32 — GPIO 2</p>

          {/* Bombillo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: ledOn ? '#fef08a' : '#e2e8f0',
              margin: '0 auto 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px',
              boxShadow: ledOn ? '0 0 24px #fde047' : 'none',
              transition: 'all 0.3s ease'
            }}>
              💡
            </div>
            <div style={{ fontSize: '14px', color: ledOn ? '#ca8a04' : '#94a3b8' }}>
              {ledOn ? 'Encendido' : 'Apagado'}
            </div>
          </div>

          {/* Toggle switch */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>OFF</span>
            <div
              onClick={!loading ? handleToggle : undefined}
              style={{
                width: '64px', height: '32px',
                background: ledOn ? '#38bdf8' : '#cbd5e1',
                borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                position: 'relative', transition: 'background 0.3s ease'
              }}
            >
              <div style={{
                width: '24px', height: '24px',
                background: 'white', borderRadius: '50%',
                position: 'absolute', top: '4px',
                left: ledOn ? '36px' : '4px',
                transition: 'left 0.3s ease'
              }} />
            </div>
            <span style={{ fontSize: '14px', color: '#64748b' }}>ON</span>
          </div>
        </div>
      </div>
    </div>
  )
}