from sqlalchemy import func
from sqlmodel import col, select

from app.core.base_repository import BaseRepository

from .models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session):
        super().__init__(session, Pedido)

    def list_by_usuario(self, id, skip, limit, estado=None):
        return self.list_page(skip, limit, estado, id)

    def list_page(self, skip, limit, estado=None, usuario_id=None):
        stmt = select(Pedido)
        if usuario_id is not None:
            stmt = stmt.where(Pedido.usuario_id == usuario_id)
        if estado:
            stmt = stmt.where(Pedido.estado == estado)
        total = self.session.exec(select(func.count()).select_from(stmt.subquery())).one()
        rows = list(self.session.exec(stmt.order_by(col(Pedido.id).desc()).offset(skip).limit(limit)).all())
        return total, rows

    def count_by_estado(self, estado):
        return self.session.exec(select(func.count(col(Pedido.id))).where(Pedido.estado == estado)).one()
