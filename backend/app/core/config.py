from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./food_store.db"
    secret_key: str = "cambiar-esta-clave-por-una-aleatoria-de-32-caracteres"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    frontend_origin: str = "http://localhost:5173"
    cookie_secure: bool = False
    seed_admin_username: str = "admin"
    seed_admin_email: str = "admin@foodstore.local"
    seed_admin_password: str = "Admin12345"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
