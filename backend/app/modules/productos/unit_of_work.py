from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository

from .repository import ProductoRepository


class ProductoUnitOfWork(UnitOfWork):
    def setup_repositories(self):
        self.productos = ProductoRepository(self.session)
        self.categorias = CategoriaRepository(self.session)
