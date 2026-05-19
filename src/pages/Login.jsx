import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-pink-500 text-center mb-2">Bienvenido</h1>
        <p className="text-center text-gray-400 mb-6">Inicia sesión en tu espacio</p>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-pink-400 hover:underline">Regístro</Link>
        </p>
      </div>
    </div>
  )
}