import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem { producto_id: number; nombre: string; precio_unitario: number; cantidad: number }
interface CartState {
  items: CartItem[]
  add: (item: Omit<CartItem, 'cantidad'>) => void
  remove: (id: number) => void
  changeQuantity: (id: number, amount: number) => void
  clear: () => void
  total: () => number
}

export const useCart = create<CartState>()(persist((set, get) => ({
  items: [],
  add: (item) => set((state) => ({ items: state.items.some((row) => row.producto_id === item.producto_id)
    ? state.items.map((row) => row.producto_id === item.producto_id ? { ...row, cantidad: row.cantidad + 1 } : row)
    : [...state.items, { ...item, cantidad: 1 }] })),
  remove: (id) => set((state) => ({ items: state.items.filter((row) => row.producto_id !== id) })),
  changeQuantity: (id, amount) => set((state) => ({ items: state.items.map((row) => row.producto_id === id ? { ...row, cantidad: Math.max(1, amount) } : row) })),
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0),
}), { name: 'food-store-cart', partialize: (state) => ({ items: state.items }) }))
