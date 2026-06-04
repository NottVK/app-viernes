import { Link } from 'react-router-dom'
import { useRegister } from '../logic/Register.logic'
import AuthSceneryLayout from '../components/scenery/AuthSceneryLayout'

export default function Register() {
  const {
    email, setEmail, password, setPassword,
    nombre, setNombre, apellido, setApellido,
    terminos, setTerminos, showTerminos, setShowTerminos,
    error, loading, handleRegister,
  } = useRegister()

  return (
    <>
      <AuthSceneryLayout
        variant="register"
        title="Crear cuenta"
        subtitle="Únete a SofKev y controla tu IoT"
        footer={
          <>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="auth-link">Inicia sesión</Link>
          </>
        }
      >
        {error && <p className="auth-msg auth-msg--error">{error}</p>}
        <form onSubmit={handleRegister} className="auth-form">
          <input
            type="text"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="auth-field"
            required
            autoComplete="given-name"
          />
          <input
            type="text"
            placeholder="Tu apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className="auth-field"
            required
            autoComplete="family-name"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-field"
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-field"
            required
            autoComplete="new-password"
          />
          <label className="auth-check">
            <input
              type="checkbox"
              checked={terminos}
              onChange={(e) => setTerminos(e.target.checked)}
            />
            <span>
              Acepto los{' '}
              <button type="button" onClick={() => setShowTerminos(true)} className="auth-link-btn">
                términos y condiciones
              </button>
              {' '}y la política de privacidad
            </span>
          </label>
          <button type="button" onClick={handleRegister} disabled={loading} className="auth-btn">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
      </AuthSceneryLayout>

      {showTerminos && (
        <div className="auth-modal-overlay" onClick={() => setShowTerminos(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid #fce7f3' }}>
              <h2 className="auth-glass__title" style={{ fontSize: '1.25rem' }}>Términos y condiciones</h2>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><p style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>1. Uso de la aplicación</p><p>Esta aplicación es de uso personal. Al registrarte aceptas usarla de forma responsable.</p></div>
              <div><p style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>2. Privacidad de datos</p><p>Tus datos serán almacenados de forma segura y no se compartirán sin tu consentimiento.</p></div>
              <div><p style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>3. Control IoT</p><p>Eres responsable del uso del control remoto de tus dispositivos conectados.</p></div>
              <div><p style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>4. Seguridad</p><p>Mantén tu contraseña segura y notifica accesos no autorizados.</p></div>
            </div>
            <div style={{ padding: '20px 24px', borderTop: '1px solid #fce7f3', display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setShowTerminos(false)} className="auth-btn auth-btn--ghost" style={{ flex: 1 }}>
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => { setTerminos(true); setShowTerminos(false) }}
                className="auth-btn"
                style={{ flex: 1 }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
