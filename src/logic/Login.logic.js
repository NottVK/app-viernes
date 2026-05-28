import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export function useLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
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

  const handleForgot = async (e) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + '/reset-password',
    })
    if (error) {
      setForgotMsg('Error al enviar el correo, intentalo nuevamente.')
    } else {
      setForgotMsg('✅ Revisa tu correo, te enviamos un enlace para restablecer tu contraseña.')
    }
    setForgotLoading(false)
  }

  const volverAlLogin = () => {
    setShowForgot(false)
    setForgotMsg('')
  }

  return {
    email, setEmail,
    password, setPassword,
    error, loading,
    showForgot, setShowForgot,
    forgotEmail, setForgotEmail,
    forgotMsg, forgotLoading,
    handleLogin, handleForgot, volverAlLogin,
  }
}