import { useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const enviando = useRef(false) // ✅ previene doble envío
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    if (enviando.current) return // ✅ si ya se está enviando, no hace nada
    enviando.current = true

    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      enviando.current = false
      return
    }

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      if (data.user) {
        const { error: perfilError } = await supabase.from('perfiles').upsert(
          {
            user_id: data.user.id,
            nombre: nombre,
            apellido: apellido,
          },
          { onConflict: 'user_id' } // ✅ si ya existe, actualiza en vez de fallar
        )

        if (perfilError) {
          setError(perfilError.message)
          setLoading(false)
          enviando.current = false
          return
        }

        navigate('/dashboard')
      } else {
        setError('Revisa tu correo para confirmar tu cuenta antes de continuar.')
      }
    }

    setLoading(false)
    enviando.current = false
  }

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-pink-500 text-center mb-2">Crear cuenta</h1>
        <p className="text-center text-gray-400 mb-6">Tu espacio personal</p>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="text"
            placeholder="Tu apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
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
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-pink-400 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}