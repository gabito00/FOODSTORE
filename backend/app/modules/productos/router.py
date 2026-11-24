from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.core.deps import require_role

from .schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from .service import CategoriaNoEncontrada, ProductoNoEncontrado, ProductoService

router = APIRouter(prefix="/productos", tags=["Productos"])


def execute(fn, *args):
    try:
        return fn(*args)
    except ProductoNoEncontrado:
        raise HTTPException(404, "Producto no encontrado")
    except CategoriaNoEncontrada:
        raise HTTPException(404, "Categoría no encontrada")


@router.get("", response_model=ProductosPaginados)
def listar(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), search: str | None = None,
           categoria_id: int | None = None, disponible: bool | None = None, service: ProductoService = Depends(ProductoService)):
    return service.listar(skip, limit, search, categoria_id, disponible)


@router.get("/{id}", response_model=ProductoRead)
def obtener(id: int, service: ProductoService = Depends(ProductoService)):
    return execute(service.obtener, id)


@router.post("", response_model=ProductoRead, status_code=201, dependencies=[Depends(require_role(["admin"]))])
def crear(data: ProductoCreate, service: ProductoService = Depends(ProductoService)):
    return execute(service.crear, data)


@router.put("/{id}", response_model=ProductoRead, dependencies=[Depends(require_role(["admin"]))])
def actualizar(id: int, data: ProductoUpdate, service: ProductoService = Depends(ProductoService)):
    return execute(service.actualizar, id, data)


@router.patch("/{id}/stock", response_model=ProductoRead, dependencies=[Depends(require_role(["admin"]))])
def stock(id: int, data: ProductoStockUpdate, service: ProductoService = Depends(ProductoService)):
    return execute(service.stock, id, data)


@router.delete("/{id}", status_code=204, dependencies=[Depends(require_role(["admin"]))])
def eliminar(id: int, service: ProductoService = Depends(ProductoService)):
    execute(service.eliminar, id)
    return Response(status_code=204)
