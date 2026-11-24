import { useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { useCart } from '../features/cart/store'
import { useAuth } from '../features/auth/store'
import { LoginPage, RegisterPage } from '../features/auth/Pages'
import { CatalogPage, CartPage } from '../features/catalog/Pages'
import { CheckoutPage, OrdersPage, SummaryPage } from '../features/orders/Pages'
import { AdminCategories, AdminProducts, AdminUsers } from '../features/admin/Pages'

function Guard({ admin = false }: { admin?: boolean }) {
  const { user, checking } = useAuth()
  if (checking) return <p className="wrap">Comprobando sesión...</p>
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/unauthorized" replace />
  return <Outlet />
}

function Layout() {
  const { user, checking, logout } = useAuth()
  const cartCount = useCart((state) => state.items.reduce((count, item) => count + item.cantidad, 0))
  const navigate = useNavigate()
  return <><nav className="bg-slate-950 px-5 py-4 text-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5"><Link className="text-xl font-bold" to="/">Food Store</Link>{!checking && user ? <><Link to="/carrito">Carrito ({cartCount})</Link><Link to="/mis-pedidos">Mis pedidos</Link>{user.role === 'admin' && <><Link to="/admin/resumen">Resumen</Link><Link to="/admin/categorias">Categorías</Link><Link to="/admin/productos">Productos</Link><Link to="/admin/pedidos">Pedidos</Link><Link to="/admin/usuarios">Usuarios</Link></>}<span className="ml-auto">{user.full_name} ({user.role})</span><button onClick={() => { void logout().then(() => navigate('/', { replace: true })) }}>Cerrar sesión</button></> : <Link className="ml-auto" to="/login">Ingresar</Link>}</div></nav><Outlet /></>
}

export function AppRouter() {
  const checkSession = useAuth((s) => s.checkSession)
  useEffect(() => { void checkSession() }, [checkSession])
  return <BrowserRouter><Routes><Route element={<Layout />}><Route path="login" element={<LoginPage />} /><Route path="register" element={<RegisterPage />} /><Route path="unauthorized" element={<main className="wrap">No tenés permiso. <Link to="/">Volver al inicio</Link></main>} />
    <Route element={<Guard />}><Route index element={<CatalogPage />} /><Route path="carrito" element={<CartPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="mis-pedidos" element={<OrdersPage />} /></Route>
    <Route element={<Guard admin />}><Route path="admin/resumen" element={<SummaryPage />} /><Route path="admin/categorias" element={<AdminCategories />} /><Route path="admin/productos" element={<AdminProducts />} /><Route path="admin/pedidos" element={<OrdersPage admin />} /><Route path="admin/usuarios" element={<AdminUsers />} /></Route>
    <Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></BrowserRouter>
}
