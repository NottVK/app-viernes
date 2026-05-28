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
        <p className="text-center text-gray-400 mb-6">Tu espacio personal</p>
        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <input type="text" placeholder="Tu apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <div className="flex items-start gap-3">
            <input type="checkbox" id="terminos" checked={terminos} onChange={(e) => setTerminos(e.target.checked)} className="mt-1 accent-pink-400 w-4 h-4 cursor-pointer" />
            <label htmlFor="terminos" className="text-sm text-gray-500 leading-relaxed">
              Acepto los{' '}
              <button type="button" onClick={() => setShowTerminos(true)} className="text-pink-400 hover:underline font-medium">términos y condiciones</button>
              {' '}y la política de privacidad
            </label>
          </div>
          <button type="button" onClick={handleRegister} disabled={loading} className="bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-pink-400 hover:underline">Inicia sesión</Link>
        </p>
      </div>

      {showTerminos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-pink-100">
              <h2 className="text-xl font-bold text-pink-500">Términos y condiciones</h2>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-500 leading-relaxed flex flex-col gap-4">
              <div><p className="font-semibold text-gray-700 mb-1">1. Uso de la aplicación</p><p>Esta aplicación es de uso personal. Al registrarte aceptas usarla de forma responsable y no compartir tus credenciales con terceros.</p></div>
              <div><p className="font-semibold text-gray-700 mb-1">2. Privacidad de datos</p><p>Tus datos personales serán almacenados de forma segura y no serán compartidos con terceros sin tu consentimiento.</p></div>
              <div><p className="font-semibold text-gray-700 mb-1">3. Control de dispositivos IoT</p><p>Eres responsable del uso del control remoto de dispositivos conectados a tu cuenta.</p></div>
              <div><p className="font-semibold text-gray-700 mb-1">4. Seguridad</p><p>Debes mantener tu contraseña segura. En caso de acceso no autorizado, debes notificarlo de inmediato.</p></div>
              <div><p className="font-semibold text-gray-700 mb-1">5. Modificaciones</p><p>Nos reservamos el derecho de modificar estos términos en cualquier momento.</p></div>
            </div>
            <div className="p-6 border-t border-pink-100 flex gap-3">
              <button onClick={() => setShowTerminos(false)} className="flex-1 py-2 border border-pink-200 text-pink-400 rounded-xl text-sm font-medium hover:bg-pink-50 transition">Cerrar</button>
              <button onClick={() => { setTerminos(true); setShowTerminos(false) }} className="flex-1 py-2 bg-pink-400 hover:bg-pink-500 text-white rounded-xl text-sm font-medium transition">Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}