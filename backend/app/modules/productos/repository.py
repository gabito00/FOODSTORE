from sqlalchemy import func
from sqlmodel import col, select

from app.core.base_repository import BaseRepository

from .models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session):
        super().__init__(session, Producto)

    def search(self, skip=0, limit=20, search=None, categoria_id=None, disponible=None):
        stmt = select(Producto).where(Producto.activo == True)
        if search:
            stmt = stmt.where(col(Producto.nombre).ilike(f"%{search}%"))
        if categoria_id is not None:
            stmt = stmt.where(Producto.categoria_id == categoria_id)
        if disponible is not None:
            stmt = stmt.where(Producto.disponible == disponible)
        count = self.session.exec(select(func.count()).select_from(stmt.subquery())).one()
        rows = self.session.exec(stmt.order_by(col(Producto.id)).offset(skip).limit(limit)).all()
        return count, list(rows)
