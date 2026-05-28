import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export function useRegister() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [terminos, setTerminos] = useState(false)
  const [showTerminos, setShowTerminos] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const enviando = useRef(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (enviando.current) return
    enviando.current = true
    setLoading(true)
    setError('')

    if (!terminos) {
      setError('Debes aceptar los términos y condiciones para continuar')
      setLoading(false)
      enviando.current = false
      return
    }

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
          { user_id: data.user.id, nombre, apellido },
          { onConflict: 'user_id' }
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

  return {
    email, setEmail,
    password, setPassword,
    nombre, setNombre,
    apellido, setApellido,
    terminos, setTerminos,
    showTerminos, setShowTerminos,
    error, loading,
    handleRegister,
  }
}