import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../../shared/api/api'
import { useCart } from '../cart/store'
import { getOrders, getSummary, type Order, type Status } from './api'

export function CheckoutPage() {
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const form = useForm({ defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as 'EFECTIVO' | 'TRANSFERENCIA', notas: '' }, onSubmit: async ({ value }) => {
    try {
      await api.post('/pedidos', { ...value, items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })) })
      clear(); navigate('/mis-pedidos')
    } catch (e) { setError(errorMessage(e)) }
  } })
  return <main className="wrap max-w-xl"><h1 className="title">Confirmar pedido</h1>{items.length === 0 ? <p>Agregá productos al carrito.</p> :
    <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
      <form.Field name="direccion_entrega">{(f) => <label>Dirección de entrega<input className="input" required minLength={5} maxLength={200} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} /></label>}</form.Field>
      <form.Field name="forma_pago">{(f) => <label>Forma de pago<select className="input" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as 'EFECTIVO' | 'TRANSFERENCIA')}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select></label>}</form.Field>
      <form.Field name="notas">{(f) => <label>Notas<textarea className="input" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} /></label>}</form.Field>
      {error && <p role="alert" className="text-red-700">{error}</p>}<button className="btn">Comprar</button>
    </form>}</main>
}

function OrderCard({ order, admin = false }: { order: Order; admin?: boolean }) {
  const client = useQueryClient()
  const mutation = useMutation({ mutationFn: (estado: Status) => admin ? api.patch(`/pedidos/${order.id}/estado`, { estado }) : api.patch(`/pedidos/${order.id}/cancelar`),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['pedidos'] }); void client.invalidateQueries({ queryKey: ['resumen'] }); void client.invalidateQueries({ queryKey: ['productos'] }) } })
  return <article className="card"><div className="flex flex-wrap justify-between"><h2 className="text-xl font-semibold">Pedido #{order.id} · {order.estado.replace('_', ' ')}</h2><strong>${order.total.toLocaleString('es-AR')}</strong></div>
    <p>Entrega: {order.direccion_entrega} · {order.forma_pago}</p><p>{new Date(order.created_at).toLocaleString('es-AR')}</p>
    <details className="my-3"><summary>Ver detalle</summary><ul>{order.items.map((i) => <li key={i.producto_id}>{i.nombre_producto} × {i.cantidad} · ${i.subtotal.toLocaleString('es-AR')}</li>)}</ul>{order.notas && <p>Notas: {order.notas}</p>}</details>
    <div className="flex gap-3">{admin && order.estado === 'PENDIENTE' && <button className="btn" onClick={() => mutation.mutate('EN_PREPARACION')}>Preparar</button>}{admin && order.estado === 'EN_PREPARACION' && <button className="btn" onClick={() => mutation.mutate('ENTREGADO')}>Entregar</button>}
      {(admin ? ['PENDIENTE', 'EN_PREPARACION'].includes(order.estado) : order.estado === 'PENDIENTE') && <button className="btn bg-red-700" onClick={() => { if (window.confirm('¿Cancelar y restituir el stock?')) mutation.mutate('CANCELADO') }}>Cancelar</button>}</div>
    {mutation.isError && <p role="alert" className="text-red-700">{errorMessage(mutation.error)}</p>}</article>
}

export function OrdersPage({ admin = false }: { admin?: boolean }) {
  const [status, setStatus] = useState<Status | undefined>()
  const query = useQuery({ queryKey: ['pedidos', admin, status], queryFn: () => getOrders(status, !admin) })
  return <main className="wrap"><h1 className="title">{admin ? 'Gestión de pedidos' : 'Mis pedidos'}</h1>{admin && <select className="input mb-5 max-w-xs" value={status ?? ''} onChange={(e) => setStatus((e.target.value || undefined) as Status | undefined)}><option value="">Todos</option>{['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO'].map((s) => <option key={s}>{s}</option>)}</select>}
    {query.isPending ? <p>Cargando pedidos...</p> : query.isError ? <p role="alert">{errorMessage(query.error)}</p> : query.data.items.length === 0 ? <p>No hay pedidos.</p> : <div className="space-y-4">{query.data.items.map((order) => <OrderCard key={order.id} order={order} admin={admin} />)}</div>}</main>
}

export function SummaryPage() {
  const query = useQuery({ queryKey: ['resumen'], queryFn: getSummary })
  return <main className="wrap"><h1 className="title">Resumen del negocio</h1>{query.isPending ? <p>Cargando...</p> : query.isError ? <p role="alert">{errorMessage(query.error)}</p> :
    <div className="grid gap-4 sm:grid-cols-3">{Object.entries(query.data).map(([key, value]) => <div className="card" key={key}><p className="capitalize text-slate-600">{key.replaceAll('_', ' ')}</p><strong className="text-3xl">{key === 'ingresos_entregados' ? `$${value.toLocaleString('es-AR')}` : value}</strong></div>)}</div>}</main>
}
