import { Link } from 'react-router-dom'
import { useRegister } from '../logic/Register.logic'

export default function Register() {
  const {
    email, setEmail, password, setPassword,
    nombre, setNombre, apellido, setApellido,
    terminos, setTerminos, showTerminos, setShowTerminos,
    error, loading, handleRegister,
  } = useRegister()

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-pink-500 text-center mb-2">Crear cuenta</h1>
        <p className="text-center text-gray-400 mb-6">Únete a SofKev y controla tu IoT</p>
        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <input type="text" placeholder="Tu apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={terminos} onChange={(e) => setTerminos(e.target.checked)} className="mt-1" />
            <span>
              Acepto los{' '}
              <button type="button" onClick={() => setShowTerminos(true)} className="text-pink-400 hover:underline">
                términos y condiciones
              </button>
              {' '}y la política de privacidad
            </span>
          </label>
          <button type="submit" disabled={loading} className="bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-pink-400 hover:underline">Inicia sesión</Link>
        </p>
      </div>

      {showTerminos && (
        <div onClick={() => setShowTerminos(false)} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 m-0">Términos y condiciones</h2>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
              <div><p className="font-semibold text-gray-800 mb-1 m-0">1. Uso de la aplicación</p><p className="m-0">Esta aplicación es de uso personal. Al registrarte aceptas usarla de forma responsable.</p></div>
              <div><p className="font-semibold text-gray-800 mb-1 m-0">2. Privacidad de datos</p><p className="m-0">Tus datos serán almacenados de forma segura y no se compartirán sin tu consentimiento.</p></div>
              <div><p className="font-semibold text-gray-800 mb-1 m-0">3. Control IoT</p><p className="m-0">Eres responsable del uso del control remoto de tus dispositivos conectados.</p></div>
              <div><p className="font-semibold text-gray-800 mb-1 m-0">4. Seguridad</p><p className="m-0">Mantén tu contraseña segura y notifica accesos no autorizados.</p></div>
            </div>
            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button type="button" onClick={() => setShowTerminos(false)} className="flex-1 py-3 bg-transparent border border-pink-400 text-pink-400 rounded-xl font-medium cursor-pointer">
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => { setTerminos(true); setShowTerminos(false) }}
                className="flex-1 py-3 bg-pink-400 text-white border-none rounded-xl font-medium cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
