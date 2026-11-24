from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_role

from .models import Usuario
from .schemas import UserPublic
from .service import UsuarioService

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios"])


@router.get("", response_model=list[UserPublic])
def listar(_admin: Usuario = Depends(require_role(["admin"])), service: UsuarioService = Depends(UsuarioService)):
    return service.list_all()


@router.post("/{id}/activar", response_model=UserPublic)
def activar(id: int, admin: Usuario = Depends(require_role(["admin"])), service: UsuarioService = Depends(UsuarioService)):
    if admin.id is None:
        raise HTTPException(401, "Sesión inválida")
    return service.set_disabled(id, False, admin.id)


@router.post("/{id}/desactivar", response_model=UserPublic)
def desactivar(id: int, admin: Usuario = Depends(require_role(["admin"])), service: UsuarioService = Depends(UsuarioService)):
    if admin.id is None:
        raise HTTPException(401, "Sesión inválida")
    return service.set_disabled(id, True, admin.id)
