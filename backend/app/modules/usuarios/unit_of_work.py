from app.core.unit_of_work import UnitOfWork

from .repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    def setup_repositories(self):
        self.usuarios = UsuarioRepository(self.session)
