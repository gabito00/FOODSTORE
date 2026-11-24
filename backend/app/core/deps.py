from fastapi import Depends, HTTPException, Request

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository


def get_current_user(request: Request) -> Usuario:
    token = request.cookies.get("access_token")
    username = decode_access_token(token) if token else None
    if not username:
        raise HTTPException(401, "No autenticado")
    with session_factory() as session:
        user = UsuarioRepository(session).get_by_username(username)
        if user is None:
            raise HTTPException(401, "Sesión inválida")
        session.expunge(user)
        return user


def get_current_active_user(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.disabled:
        raise HTTPException(400, "Cuenta de usuario desactivada")
    return user


def require_role(roles: list[str]):
    def check(user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if user.role not in roles:
            raise HTTPException(403, "Permisos insuficientes")
        return user
    return check
