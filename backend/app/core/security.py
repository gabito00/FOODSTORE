from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return context.verify(password, hashed)


def create_access_token(username: str) -> str:
    expires = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": username, "exp": expires}, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm]).get("sub")
    except JWTError:
        return None
