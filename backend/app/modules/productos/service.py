from .models import Producto
from .schemas import ProductoRead, ProductosPaginados
from .unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception):
    pass


class CategoriaNoEncontrada(Exception):
    pass


class ProductoService:
    def __init__(self, uow=None):
        self.uow = uow or ProductoUnitOfWork()

    def _categoria(self, uow, id):
        c = uow.categorias.get_by_id(id)
        if c is None or not c.activo:
            raise CategoriaNoEncontrada()

    def _get(self, uow, id):
        p = uow.productos.get_by_id(id)
        if p is None or not p.activo:
            raise ProductoNoEncontrado()
        return p

    def listar(self, skip, limit, search, categoria_id, disponible):
        with self.uow as uow:
            total, rows = uow.productos.search(skip, limit, search, categoria_id, disponible)
            return ProductosPaginados(total=total, items=[ProductoRead.model_validate(p) for p in rows])

    def obtener(self, id):
        with self.uow as uow:
            return ProductoRead.model_validate(self._get(uow, id))

    def crear(self, data):
        with self.uow as uow:
            self._categoria(uow, data.categoria_id)
            p = uow.productos.add(Producto.model_validate(data))
            uow.session.refresh(p)
            return ProductoRead.model_validate(p)

    def actualizar(self, id, data):
        with self.uow as uow:
            p = self._get(uow, id)
            fields = data.model_dump(exclude_unset=True)
            if fields.get("categoria_id") is not None:
                self._categoria(uow, fields["categoria_id"])
            for key, value in fields.items():
                setattr(p, key, value)
            uow.session.flush()
            uow.session.refresh(p)
            return ProductoRead.model_validate(p)

    def stock(self, id, data):
        with self.uow as uow:
            p = self._get(uow, id)
            p.stock, p.disponible = data.stock, data.disponible
            return ProductoRead.model_validate(p)

    def eliminar(self, id):
        with self.uow as uow:
            self._get(uow, id).activo = False
