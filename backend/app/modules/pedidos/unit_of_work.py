from app.core.unit_of_work import UnitOfWork
from app.modules.productos.repository import ProductoRepository

from .repository import PedidoRepository


class PedidoUnitOfWork(UnitOfWork):
    def setup_repositories(self):
        self.pedidos = PedidoRepository(self.session)
        self.productos = ProductoRepository(self.session)
