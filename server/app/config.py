from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    port: int = 8000
    cors_origin: str = "http://localhost:3000"
    database_url: str = "sqlite:///./zoom_clone.db"
    access_token_secret: str = "change-this-secret-in-production"
    access_token_expire_minutes: int = 1440
    frontend_url: str = "http://localhost:3000"

    default_user_full_name: str = "Demo User"
    default_user_username: str = "demo"
    default_user_email: str = "demo@zoom.dev"
    default_user_password: str = "Demo1234"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
