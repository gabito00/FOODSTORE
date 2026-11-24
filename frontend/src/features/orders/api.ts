import { api } from '../../shared/api/api'
import type { Page } from '../catalog/api'

export type Status = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO'
export interface OrderItem { producto_id: number; nombre_producto: string; precio_unitario: number; cantidad: number; subtotal: number }
export interface Order { id: number; usuario_id: number; estado: Status; forma_pago: 'EFECTIVO' | 'TRANSFERENCIA'; direccion_entrega: string; notas: string | null; total: number; created_at: string; items: OrderItem[] }
export interface Summary { pendientes: number; en_preparacion: number; entregados: number; cancelados: number; pedidos_hoy: number; ingresos_entregados: number }
export const getOrders = async (estado: Status | undefined, propios: boolean) => (await api.get<Page<Order>>('/pedidos', { params: { limit: 100, estado, propios } })).data
export const getSummary = async () => (await api.get<Summary>('/pedidos/resumen')).data
