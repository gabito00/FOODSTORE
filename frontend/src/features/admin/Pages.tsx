import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, errorMessage } from '../../shared/api/api'
import { categories, products, type Category, type Product } from '../catalog/api'
import { useAuth, type User } from '../auth/store'

function Table<T>({ rows, columns }: { rows: T[]; columns: ColumnDef<T>[] }) {
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() })
  return <div className="overflow-x-auto"><table className="w-full text-left"><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((head) => <th className="p-3" key={head.id}>{flexRender(head.column.columnDef.header, head.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr className="border-t" key={row.id}>{row.getVisibleCells().map((cell) => <td className="p-3" key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table><div className="mt-4 flex gap-4"><button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Anterior</button><button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Siguiente</button></div></div>
}

export function AdminCategories() {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['categorias'], queryFn: categories })
  const [editing, setEditing] = useState<Category | null>(null)
  const action = useMutation({ mutationFn: async (data: { nombre: string; descripcion: string }) => editing ? api.put(`/categorias/${editing.id}`, data) : api.post('/categorias', data), onSuccess: () => { void client.invalidateQueries({ queryKey: ['categorias'] }); setEditing(null); form.reset() } })
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/categorias/${id}`), onSuccess: () => void client.invalidateQueries({ queryKey: ['categorias'] }) })
  const form = useForm({ defaultValues: { nombre: '', descripcion: '' }, onSubmit: async ({ value }) => { await action.mutateAsync(value) } })
  const columns: ColumnDef<Category>[] = [{ accessorKey: 'nombre', header: 'Nombre' }, { accessorKey: 'descripcion', header: 'Descripción' }, { id: 'acciones', header: 'Acciones', cell: ({ row }) => <><button onClick={() => { setEditing(row.original); form.setFieldValue('nombre', row.original.nombre); form.setFieldValue('descripcion', row.original.descripcion) }}>Editar</button> · <button onClick={() => { if (window.confirm('¿Dar de baja?')) remove.mutate(row.original.id) }}>Baja</button></> }]
  return <main className="wrap"><h1 className="title">Categorías</h1><form className="card mb-5 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}><form.Field name="nombre">{(f) => <label>Nombre<input className="input" required minLength={2} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} /></label>}</form.Field><form.Field name="descripcion">{(f) => <label>Descripción<input className="input" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} /></label>}</form.Field><button className="btn">{editing ? 'Guardar' : 'Crear'}</button>{editing && <button type="button" onClick={() => { setEditing(null); form.reset() }}>Cancelar edición</button>}</form>{action.isError && <p role="alert">{errorMessage(action.error)}</p>}{remove.isError && <p role="alert">{errorMessage(remove.error)}</p>}{query.isPending ? 'Cargando...' : query.isError ? errorMessage(query.error) : <Table rows={query.data} columns={columns} />}</main>
}

export function AdminProducts() {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['productos', 'admin'], queryFn: () => products({ skip: 0, limit: 100, search: '' }) })
  const cats = useQuery({ queryKey: ['categorias'], queryFn: categories })
  const [editing, setEditing] = useState<Product | null>(null)
  const defaults = { nombre: '', descripcion: '', categoria_id: 0, precio_base: 0, imagen_url: '', stock: 0, disponible: true }
  const form = useForm({ defaultValues: defaults, onSubmit: async ({ value }) => { await save.mutateAsync(value) } })
  const refresh = () => void client.invalidateQueries({ queryKey: ['productos'] })
  const save = useMutation({ mutationFn: (value: typeof defaults) => editing ? api.put(`/productos/${editing.id}`, value) : api.post('/productos', value), onSuccess: () => { refresh(); setEditing(null); form.reset() } })
  const stock = useMutation({ mutationFn: ({ id, value, available }: { id: number; value: number; available: boolean }) => api.patch(`/productos/${id}/stock`, { stock: value, disponible: available }), onSuccess: refresh })
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/productos/${id}`), onSuccess: refresh })
  const columns: ColumnDef<Product>[] = [{ accessorKey: 'nombre', header: 'Producto' }, { accessorFn: (row: Product) => row.categoria.nombre, header: 'Categoría' }, { accessorKey: 'precio_base', header: 'Precio' }, { accessorKey: 'stock', header: 'Stock' }, { id: 'acciones', header: 'Acciones', cell: ({ row }) => <div className="flex gap-2"><button onClick={() => { setEditing(row.original); Object.entries(row.original).forEach(([k, v]) => { if (k in defaults) form.setFieldValue(k as keyof typeof defaults, v as never) }) }}>Editar</button><button onClick={() => { const value = window.prompt('Nuevo stock', String(row.original.stock)); if (value !== null && Number(value) >= 0) stock.mutate({ id: row.original.id, value: Number(value), available: row.original.disponible }) }}>Stock</button><button onClick={() => stock.mutate({ id: row.original.id, value: row.original.stock, available: !row.original.disponible })}>{row.original.disponible ? 'Ocultar' : 'Habilitar'}</button><button onClick={() => { if (window.confirm('¿Dar de baja?')) remove.mutate(row.original.id) }}>Baja</button></div> }]
  return <main className="wrap"><h1 className="title">Productos</h1><form className="card mb-5 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
    <form.Field name="nombre">{(f) => <label>Nombre<input className="input" required minLength={2} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} /></label>}</form.Field>
    <form.Field name="categoria_id">{(f) => <label>Categoría<select className="input" required value={f.state.value} onChange={(e) => f.handleChange(Number(e.target.value))}><option value="0">Elegir</option>{cats.data?.map((c) => <option value={c.id} key={c.id}>{c.nombre}</option>)}</select></label>}</form.Field>
    <form.Field name="precio_base">{(f) => <label>Precio<input className="input" type="number" min="0" step="0.01" value={f.state.value} onChange={(e) => f.handleChange(Number(e.target.value))} /></label>}</form.Field>
    <form.Field name="stock">{(f) => <label>Stock<input className="input" type="number" min="0" value={f.state.value} onChange={(e) => f.handleChange(Number(e.target.value))} /></label>}</form.Field>
    <form.Field name="descripcion">{(f) => <label>Descripción<input className="input" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} /></label>}</form.Field>
    <form.Field name="imagen_url">{(f) => <label>URL imagen<input className="input" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} /></label>}</form.Field>
    <button className="btn">{editing ? 'Guardar cambios' : 'Crear producto'}</button>{editing && <button type="button" onClick={() => { setEditing(null); form.reset() }}>Cancelar edición</button>}</form>{[save, stock, remove].map((m, i) => m.isError && <p key={i} role="alert">{errorMessage(m.error)}</p>)}{query.isPending ? 'Cargando...' : query.isError ? errorMessage(query.error) : <Table rows={query.data.items} columns={columns} />}</main>
}

export function AdminUsers() {
  const client = useQueryClient()
  const me = useAuth((s) => s.user)
  const query = useQuery({ queryKey: ['usuarios'], queryFn: async () => (await api.get<User[]>('/admin/usuarios')).data })
  const change = useMutation({ mutationFn: ({ id, disabled }: { id: number; disabled: boolean }) => api.post(`/admin/usuarios/${id}/${disabled ? 'desactivar' : 'activar'}`), onSuccess: () => void client.invalidateQueries({ queryKey: ['usuarios'] }) })
  const columns: ColumnDef<User>[] = [{ accessorKey: 'username', header: 'Usuario' }, { accessorKey: 'full_name', header: 'Nombre' }, { accessorKey: 'email', header: 'Email' }, { accessorKey: 'role', header: 'Rol' }, { accessorKey: 'disabled', header: 'Estado', cell: ({ row }) => row.original.disabled ? 'Desactivado' : 'Activo' }, { id: 'acciones', header: 'Acción', cell: ({ row }) => row.original.id === me?.id ? null : <button onClick={() => change.mutate({ id: row.original.id, disabled: !row.original.disabled })}>{row.original.disabled ? 'Activar' : 'Desactivar'}</button> }]
  return <main className="wrap"><h1 className="title">Usuarios</h1>{change.isError && <p role="alert">{errorMessage(change.error)}</p>}{query.isPending ? 'Cargando...' : query.isError ? errorMessage(query.error) : <Table rows={query.data} columns={columns} />}</main>
}


