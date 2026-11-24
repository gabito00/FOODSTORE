from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_active_user, require_role
from app.modules.usuarios.models import Usuario

from .schemas import (
    CambioEstado,
    Estado,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from .service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoEncontrado,
    ReglaPedido,
)

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def execute(fn, *args):
    try:
        return fn(*args)
    except PedidoNoEncontrado:
        raise HTTPException(404, "Pedido no encontrado")
    except ProductoNoEncontrado:
        raise HTTPException(404, "Producto no encontrado")
    except PedidoAjeno:
        raise HTTPException(403, "Pedido ajeno")
    except ReglaPedido as exc:
        raise HTTPException(400, str(exc))


@router.post("", response_model=PedidoRead, status_code=201)
def crear(data: PedidoCreate, user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(PedidoService)):
    return execute(service.crear, data, user.id)


@router.get("", response_model=PedidosPaginados)
def listar(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), estado: Estado | None = None, propios: bool = False,
           user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(PedidoService)):
    return service.listar(skip, limit, estado, user, propios)


@router.get("/resumen", response_model=ResumenPedidos)
def resumen(_admin: Usuario = Depends(require_role(["admin"])), service: PedidoService = Depends(PedidoService)):
    return service.resumen()


@router.get("/{id}", response_model=PedidoRead)
def obtener(id: int, user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(PedidoService)):
    return execute(service.obtener, id, user)


@router.patch("/{id}/estado", response_model=PedidoRead)
def cambiar(id: int, data: CambioEstado, admin: Usuario = Depends(require_role(["admin"])), service: PedidoService = Depends(PedidoService)):
    return execute(service.cambiar_estado, id, data.estado, admin)


@router.patch("/{id}/cancelar", response_model=PedidoRead)
def cancelar(id: int, user: Usuario = Depends(get_current_active_user), service: PedidoService = Depends(PedidoService)):
    return execute(service.cancelar, id, user)
