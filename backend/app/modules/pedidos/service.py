from datetime import date

from sqlalchemy import func
from sqlmodel import col, select

from .models import DetallePedido, Pedido, now
from .schemas import PedidoRead, PedidosPaginados, ResumenPedidos
from .unit_of_work import PedidoUnitOfWork

TRANSICIONES = {
    "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
    "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
    "ENTREGADO": set(),
    "CANCELADO": set(),
}


class PedidoNoEncontrado(Exception):
    pass


class PedidoAjeno(Exception):
    pass


class ReglaPedido(Exception):
    pass


class ProductoNoEncontrado(Exception):
    pass


class PedidoService:
    def __init__(self, uow=None):
        self.uow = uow or PedidoUnitOfWork()

    def crear(self, data, usuario_id):
        with self.uow as uow:
            ids = [item.producto_id for item in data.items]
            if len(ids) != len(set(ids)):
                raise ReglaPedido("Producto repetido")
            pedido = uow.pedidos.add(Pedido(usuario_id=usuario_id, forma_pago=data.forma_pago,
                                           direccion_entrega=data.direccion_entrega, notas=data.notas))
            if pedido.id is None:
                raise RuntimeError("El pedido guardado no tiene ID")
            for item in data.items:
                # En PostgreSQL bloquea la fila para evitar dos compras simultáneas del mismo stock.
                stmt = select(uow.productos.model).where(uow.productos.model.id == item.producto_id).with_for_update()
                producto = uow.session.exec(stmt).first()
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado()
                if not producto.disponible:
                    raise ReglaPedido("Producto no disponible")
                if producto.stock < item.cantidad:
                    raise ReglaPedido("Stock insuficiente")
                if producto.id is None:
                    raise RuntimeError("El producto guardado no tiene ID")
                producto.stock -= item.cantidad
                subtotal = round(producto.precio_base * item.cantidad, 2)
                uow.session.add(DetallePedido(pedido_id=pedido.id, producto_id=producto.id,
                                              cantidad=item.cantidad, nombre_producto=producto.nombre,
                                              precio_unitario=producto.precio_base, subtotal=subtotal))
                pedido.total = round(pedido.total + subtotal, 2)
            uow.session.flush()
            uow.session.refresh(pedido)
            return PedidoRead.model_validate(pedido)

    def _get(self, uow, id, user):
        pedido = uow.pedidos.get_by_id(id)
        if pedido is None:
            raise PedidoNoEncontrado()
        if user.role != "admin" and pedido.usuario_id != user.id:
            raise PedidoAjeno()
        return pedido

    def obtener(self, id, user):
        with self.uow as uow:
            return PedidoRead.model_validate(self._get(uow, id, user))

    def listar(self, skip, limit, estado, user, propios=False):
        with self.uow as uow:
            total, rows = uow.pedidos.list_page(skip, limit, estado, None if user.role == "admin" and not propios else user.id)
            return PedidosPaginados(total=total, items=[PedidoRead.model_validate(p) for p in rows])

    def _cambiar(self, uow, pedido, estado):
        if estado not in TRANSICIONES[pedido.estado]:
            raise ReglaPedido("Transición inválida")
        if estado == "CANCELADO":
            for item in pedido.items:
                producto = uow.productos.get_by_id(item.producto_id)
                producto.stock += item.cantidad
        pedido.estado, pedido.updated_at = estado, now()
        return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, id, estado, admin):
        with self.uow as uow:
            return self._cambiar(uow, self._get(uow, id, admin), estado)

    def cancelar(self, id, user):
        with self.uow as uow:
            pedido = self._get(uow, id, user)
            if pedido.estado != "PENDIENTE":
                raise ReglaPedido("Solo se puede cancelar un pedido pendiente")
            return self._cambiar(uow, pedido, "CANCELADO")

    def resumen(self):
        with self.uow as uow:
            counts = {estado: uow.pedidos.count_by_estado(estado) for estado in TRANSICIONES}
            today = uow.session.exec(select(func.count(col(Pedido.id))).where(func.date(Pedido.created_at) == date.today().isoformat())).one()
            income = uow.session.exec(select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == "ENTREGADO")).one()
            return ResumenPedidos(pendientes=counts["PENDIENTE"], en_preparacion=counts["EN_PREPARACION"],
                                  entregados=counts["ENTREGADO"], cancelados=counts["CANCELADO"],
                                  pedidos_hoy=today, ingresos_entregados=income)
