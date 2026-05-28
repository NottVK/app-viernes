import { useResetPassword } from '../logic/ResetPassword.logic'

export default function ResetPassword() {
  const { password, setPassword, confirm, setConfirm, error, msg, loading, handleReset } = useResetPassword()

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-pink-500 text-center mb-2">Nueva contraseña</h1>
        <p className="text-center text-gray-400 mb-6">Escribe tu nueva contraseña</p>
        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
        {msg && <p className="text-green-500 text-sm text-center mb-4">{msg}</p>}
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <input type="password" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
          <button type="submit" disabled={loading} className="bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition">
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}