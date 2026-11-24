from .models import Categoria
from .schemas import CategoriaRead
from .unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class CategoriaService:
    def __init__(self, uow=None):
        self.uow = uow or CategoriaUnitOfWork()

    def listar(self):
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.activos()]

    def obtener(self, id):
        with self.uow as uow:
            c = uow.categorias.get_by_id(id)
            if c is None or not c.activo:
                raise CategoriaNoEncontrada()
            return CategoriaRead.model_validate(c)

    def crear(self, data):
        with self.uow as uow:
            if uow.categorias.get_by_nombre(data.nombre):
                raise NombreDuplicado()
            return CategoriaRead.model_validate(uow.categorias.add(Categoria.model_validate(data)))

    def actualizar(self, id, data):
        with self.uow as uow:
            c = uow.categorias.get_by_id(id)
            if c is None or not c.activo:
                raise CategoriaNoEncontrada()
            fields = data.model_dump(exclude_unset=True)
            existing = uow.categorias.get_by_nombre(fields["nombre"]) if fields.get("nombre") else None
            if existing is not None and existing.id != id:
                raise NombreDuplicado()
            for key, value in fields.items():
                setattr(c, key, value)
            return CategoriaRead.model_validate(c)

    def eliminar(self, id):
        with self.uow as uow:
            c = uow.categorias.get_by_id(id)
            if c is None or not c.activo:
                raise CategoriaNoEncontrada()
            c.activo = False
