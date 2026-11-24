import { api } from '../../shared/api/api'

export interface Category { id: number; nombre: string; descripcion: string; activo: boolean }
export interface Product { id: number; nombre: string; descripcion: string; precio_base: number; imagen_url: string; stock: number; disponible: boolean; activo: boolean; categoria_id: number; categoria: Category }
export interface Page<T> { total: number; items: T[] }

export const categories = async () => (await api.get<Category[]>('/categorias')).data
export const products = async (params: { skip: number; limit: number; search: string; categoria_id?: number }) => (await api.get<Page<Product>>('/productos', { params })).data
