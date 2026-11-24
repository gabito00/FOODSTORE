from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.deps import require_role

from .schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from .service import CategoriaNoEncontrada, CategoriaService, NombreDuplicado

router = APIRouter(prefix="/categorias", tags=["Categorías"])


def execute(fn, *args):
    try:
        return fn(*args)
    except CategoriaNoEncontrada:
        raise HTTPException(404, "Categoría no encontrada")
    except NombreDuplicado:
        raise HTTPException(409, "Nombre de categoría duplicado")


@router.get("", response_model=list[CategoriaRead])
def listar(service: CategoriaService = Depends(CategoriaService)):
    return service.listar()


@router.get("/{id}", response_model=CategoriaRead)
def obtener(id: int, service: CategoriaService = Depends(CategoriaService)):
    return execute(service.obtener, id)


@router.post("", response_model=CategoriaRead, status_code=201, dependencies=[Depends(require_role(["admin"]))])
def crear(data: CategoriaCreate, service: CategoriaService = Depends(CategoriaService)):
    return execute(service.crear, data)


@router.put("/{id}", response_model=CategoriaRead, dependencies=[Depends(require_role(["admin"]))])
def actualizar(id: int, data: CategoriaUpdate, service: CategoriaService = Depends(CategoriaService)):
    return execute(service.actualizar, id, data)


@router.delete("/{id}", status_code=204, dependencies=[Depends(require_role(["admin"]))])
def eliminar(id: int, service: CategoriaService = Depends(CategoriaService)):
    execute(service.eliminar, id)
    return Response(status_code=204)
