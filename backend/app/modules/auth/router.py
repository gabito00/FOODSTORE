from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import get_current_active_user
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic

from .service import AuthService

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=UserPublic, status_code=201)
def register(data: UserCreate, service: AuthService = Depends(AuthService)):
    return service.register(data)


@router.post("/token")
def login(response: Response, form: OAuth2PasswordRequestForm = Depends(), service: AuthService = Depends(AuthService)):
    token = service.login(form.username, form.password)
    response.set_cookie("access_token", token, httponly=True, secure=settings.cookie_secure,
                        samesite="lax", max_age=settings.access_token_expire_minutes * 60)
    return {"message": "Login exitoso"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Sesión cerrada"}


@router.get("/me", response_model=UserPublic)
def me(user: Usuario = Depends(get_current_active_user)):
    return UserPublic.model_validate(user)
