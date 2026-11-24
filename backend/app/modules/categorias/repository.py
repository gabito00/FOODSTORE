from sqlmodel import col, select

from app.core.base_repository import BaseRepository

from .models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session):
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre):
        return self.session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()

    def activos(self):
        return list(self.session.exec(select(Categoria).where(Categoria.activo == True).order_by(col(Categoria.id))).all())
