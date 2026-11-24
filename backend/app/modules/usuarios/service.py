from fastapi import HTTPException

from .schemas import UserPublic
from .unit_of_work import UsuarioUnitOfWork


class UsuarioService:
    def __init__(self, uow=None):
        self.uow = uow or UsuarioUnitOfWork()

    def list_all(self):
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.get_all()]

    def set_disabled(self, id: int, disabled: bool, admin_id: int):
        with self.uow as uow:
            user = uow.usuarios.get_by_id(id)
            if user is None:
                raise HTTPException(404, "Usuario no encontrado")
            if disabled and id == admin_id:
                raise HTTPException(400, "No podés desactivarte a vos mismo")
            user.disabled = disabled
            return UserPublic.model_validate(user)
