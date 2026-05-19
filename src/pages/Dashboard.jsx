import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-pink-500 mb-4">¡Bienvenido! </h1>
        <button
          onClick={handleLogout}
          className="bg-pink-400 hover:bg-pink-500 text-white px-6 py-2 rounded-xl"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}