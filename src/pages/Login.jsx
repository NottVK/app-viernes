import { Link } from 'react-router-dom'
import { useLogin } from '../logic/Login.logic'

export default function Login() {
  const {
    email, setEmail, password, setPassword,
    error, loading, showForgot, setShowForgot,
    forgotEmail, setForgotEmail, forgotMsg, forgotLoading,
    handleLogin, handleForgot, volverAlLogin,
  } = useLogin()

  if (showForgot) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
          <h1 className="text-3xl font-bold text-pink-500 text-center mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-center text-gray-400 mb-6">Te enviaremos un enlace para restablecerla</p>
          {forgotMsg && (
            <p className={`text-sm text-center mb-4 ${forgotMsg.startsWith('✅') ? 'text-green-500' : 'text-red-400'}`}>
              {forgotMsg}
            </p>
          )}
          <form onSubmit={handleForgot} className="flex flex-col gap-4">
            <input type="email" placeholder="Correo electrónico" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
            <button type="submit" disabled={forgotLoading} className="bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition">
              {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-4">
            <button onClick={volverAlLogin} className="text-pink-400 hover:underline">← Volver al inicio de sesión</button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-pink-500 text-center mb-2">Bienvenido</h1>
        <p className="text-center text-gray-400 mb-6">Inicia sesión en tu espacio</p>
        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <div className="text-right -mt-2">
            <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-pink-400 hover:underline">¿Olvidaste tu contraseña?</button>
          </div>
          <button type="submit" disabled={loading} className="bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-pink-400 hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}