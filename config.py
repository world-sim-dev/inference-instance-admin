from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"  # Ignore extra fields in .env file
    )
    
    database_url: str = "sqlite:///./inference_instances.db"
    
    # Authentication Configuration
    auth_username: str = "admin"
    auth_password_hash: str = "$2b$12$UKaYdrSkZRYQe8DtbjnLa.D37NzLS.4PNInZIzRlAubyyKe7sb/dy"
    auth_rate_limit: int = 10  # requests per minute
    auth_session_timeout: int = 3600  # seconds
    auth_max_retry_attempts: int = 3


settings = Settings()