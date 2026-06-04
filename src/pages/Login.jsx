import { Link } from 'react-router-dom'
import { useLogin } from '../logic/Login.logic'
import AuthSceneryLayout from '../components/scenery/AuthSceneryLayout'

export default function Login() {
  const {
    email, setEmail, password, setPassword,
    error, loading, showForgot, setShowForgot,
    forgotEmail, setForgotEmail, forgotMsg, forgotLoading,
    handleLogin, handleForgot, volverAlLogin,
  } = useLogin()

  if (showForgot) {
    return (
      <AuthSceneryLayout
        variant="forgot"
        title="¿Olvidaste tu contraseña?"
        subtitle="Te enviaremos un enlace para restablecerla"
        footer={
          <button type="button" onClick={volverAlLogin} className="auth-link-btn">
            ← Volver al inicio de sesión
          </button>
        }
      >
        {forgotMsg && (
          <p className={`auth-msg ${forgotMsg.startsWith('✅') ? 'auth-msg--ok' : 'auth-msg--error'}`}>
            {forgotMsg}
          </p>
        )}
        <form onSubmit={handleForgot} className="auth-form">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="auth-field"
            required
            autoComplete="email"
          />
          <button type="submit" disabled={forgotLoading} className="auth-btn">
            {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      </AuthSceneryLayout>
    )
  }

  return (
    <AuthSceneryLayout
      variant="login"
      title="Bienvenido"
      subtitle="Inicia sesión en tu panel IoT"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="auth-link">Regístrate</Link>
        </>
      }
    >
      {error && <p className="auth-msg auth-msg--error">{error}</p>}
      <form onSubmit={handleLogin} className="auth-form">
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
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-field"
          required
          autoComplete="current-password"
        />
        <div className="auth-row">
          <button type="button" onClick={() => setShowForgot(true)} className="auth-link-btn">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </AuthSceneryLayout>
  )
}
