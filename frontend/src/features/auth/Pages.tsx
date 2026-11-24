import { useForm } from '@tanstack/react-form'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { api, errorMessage } from '../../shared/api/api'
import { useAuth } from './store'

export function LoginPage() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const form = useForm({ defaultValues: { username: '', password: '' }, onSubmit: async ({ value }) => {
    try { await login(value.username, value.password); navigate('/') } catch (e) { setError(errorMessage(e)) }
  } })
  return <main className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 shadow"><h1 className="text-3xl font-bold">Ingresar</h1>
    <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }} className="mt-6 space-y-4">
      <form.Field name="username">{(field) => <input className="input" placeholder="Usuario" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />}</form.Field>
      <form.Field name="password">{(field) => <input className="input" type="password" placeholder="Contraseña" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />}</form.Field>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button className="btn w-full">Ingresar</button>
    </form><Link className="mt-4 block text-indigo-700" to="/register">Crear una cuenta</Link></main>
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const form = useForm({ defaultValues: { username: '', full_name: '', email: '', password: '' }, onSubmit: async ({ value }) => {
    try { await api.post('/auth/register', value); navigate('/login') } catch (e) { setError(errorMessage(e)) }
  } })
  return <main className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 shadow"><h1 className="text-3xl font-bold">Registro</h1>
    <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }} className="mt-6 space-y-4">
      <form.Field name="username">{(f) => <input className="input" placeholder="Usuario" minLength={2} required value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
      <form.Field name="full_name">{(f) => <input className="input" placeholder="Nombre completo" minLength={2} required value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
      <form.Field name="email">{(f) => <input className="input" type="email" placeholder="Email" required value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
      <form.Field name="password">{(f) => <input className="input" type="password" placeholder="Contraseña (mínimo 8)" minLength={8} required value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}</form.Field>
      {error && <p role="alert" className="text-red-700">{error}</p>}<button className="btn w-full">Registrarme</button>
    </form><Link className="mt-4 block text-indigo-700" to="/login">Ya tengo cuenta</Link></main>
}
