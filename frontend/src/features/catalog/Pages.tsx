import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { categories, products } from './api'
import { useCart } from '../cart/store'

export function CatalogPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<number | undefined>()
  const add = useCart((s) => s.add)
  const cartItems = useCart((s) => s.items)
  const cats = useQuery({ queryKey: ['categorias'], queryFn: categories })
  const list = useQuery({ queryKey: ['productos', page, search, category], queryFn: () => products({ skip: page * 8, limit: 8, search, categoria_id: category }) })
  return <main className="wrap"><header className="mb-8"><h1 className="text-4xl font-bold">Comida para disfrutar</h1><p className="text-slate-600">Elegí tus favoritos y armá tu pedido.</p></header>
    <div className="mb-6 flex flex-wrap gap-3"><input className="input max-w-sm" aria-label="Buscar producto" placeholder="Buscar por nombre" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} />
      <select className="input max-w-xs" aria-label="Categoría" value={category ?? ''} onChange={(e) => { setCategory(e.target.value ? Number(e.target.value) : undefined); setPage(0) }}><option value="">Todas las categorías</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
    {list.isPending ? <div className="grid gap-5 md:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-200" />)}</div> : list.isError ? <p role="alert">Error al cargar productos. <button onClick={() => void list.refetch()}>Reintentar</button></p> : list.data.items.length === 0 ? <p>No hay productos para esta búsqueda.</p> :
      <div className="grid gap-5 md:grid-cols-3">{list.data.items.map((p) => <article className="card" key={p.id}>{p.imagen_url && <img src={p.imagen_url} alt={p.nombre} className="h-36 w-full rounded-lg object-cover" />}<p className="text-sm text-indigo-700">{p.categoria.nombre}</p><h2 className="text-xl font-semibold">{p.nombre}</h2><p>{p.descripcion}</p><p className="my-3 font-bold">${p.precio_base.toLocaleString('es-AR')}</p><button className="btn" disabled={!p.disponible || p.stock < 1} onClick={() => add({ producto_id: p.id, nombre: p.nombre, precio_unitario: p.precio_base })}>{p.stock < 1 ? 'Sin stock' : 'Agregar al carrito'}</button><p role="status" className="mt-2 text-sm text-slate-600">{cartItems.some((item) => item.producto_id === p.id) && ` en el carrito`}</p></article>)}</div>}
    <div className="mt-6 flex items-center gap-3"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page + 1}</span><button disabled={!list.data || (page + 1) * 8 >= list.data.total} onClick={() => setPage(page + 1)}>Siguiente</button></div></main>
}

export function CartPage() {
  const { items, remove, changeQuantity, total } = useCart()
  return <main className="wrap"><h1 className="title">Tu carrito</h1>{items.length === 0 ? <p>El carrito está vacío. <Link to="/">Ver catálogo</Link></p> : <><div className="space-y-3">{items.map((item) => <article className="card flex items-center justify-between gap-4" key={item.producto_id}><div><h2 className="font-semibold">{item.nombre}</h2><p>${item.precio_unitario.toLocaleString('es-AR')} c/u</p></div><input aria-label={`Cantidad de ${item.nombre}`} className="input w-24" type="number" min="1" value={item.cantidad} onChange={(e) => changeQuantity(item.producto_id, Number(e.target.value))} /><button onClick={() => remove(item.producto_id)}>Quitar</button></article>)}</div><p className="my-6 text-xl font-bold">Total: ${total().toLocaleString('es-AR')}</p><Link className="btn" to="/checkout">Confirmar pedido</Link></>}</main>
}
