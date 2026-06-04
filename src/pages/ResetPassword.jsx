import { useResetPassword } from '../logic/ResetPassword.logic'
import AuthSceneryLayout from '../components/scenery/AuthSceneryLayout'

export default function ResetPassword() {
  const { password, setPassword, confirm, setConfirm, error, msg, loading, handleReset } = useResetPassword()

  return (
    <AuthSceneryLayout
      variant="reset"
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta"
    >
      {error && <p className="auth-msg auth-msg--error">{error}</p>}
      {msg && <p className="auth-msg auth-msg--ok">{msg}</p>}
      <form onSubmit={handleReset} className="auth-form">
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-field"
          required
          autoComplete="new-password"
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="auth-field"
          required
          autoComplete="new-password"
        />
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthSceneryLayout>
  )
}
