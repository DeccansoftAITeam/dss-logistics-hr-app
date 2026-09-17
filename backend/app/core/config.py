from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings configured from environment variables or .env file.
    """

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = Field(
        default="postgresql+asyncpg://ask_policy_user:qAc4lFaxtXP3UjD2fXnBn0CWieR99e5x@dpg-dal4nt5g1s2s73e88ph0-a.oregon-postgres.render.com:5432/ask_policy"
    )
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "*"]

    # Clerk Authentication
    clerk_publishable_key: str = ""
    clerk_secret_key: str = ""
    clerk_org_id: str = "org_3JOvLRFnE0PQixivSXSmJC5Gcdt"
    clerk_jwks_url: str = "https://sensible-skylark-9101.clerk.accounts.dev/.well-known/jwks.json"

    # Azure OpenAI
    azure_openai_endpoint: str = "https://suresh-azurefoundry-research.openai.azure.com/"
    azure_openai_api_key: str = ""
    azure_openai_chat_deployment: str = "gpt-5.6-luna"
    azure_openai_embedding_deployment: str = "text-embedding-3-large"

    # Azure Storage
    azure_storage_connection_string: str = ""
    azure_storage_container: str = "dss-ask-policy-content"

    # Atlassian Jira / Forge
    jira_site_url: str = "https://fde-dss-logistics.atlassian.net"
    jira_email: str = ""
    jira_api_token: str = ""
    jira_project_key: str = "HRSD"

    # Session / Cache
    permission_cache_ttl_seconds: int = 300

    # Bootstrap admin: if set, this email is auto-promoted to verified Admin on
    # first sign-in. Used for one-click participant deployments where the database
    # starts empty.
    admin_bootstrap_email: str = ""

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def async_database_url(self) -> str:
        """
        Render managed Postgres provides DATABASE_URL starting with postgres://
        or postgresql://. SQLAlchemy async engine requires postgresql+asyncpg://.
        Also appends sslmode=require for asyncpg if not present and connecting to Render.
        """
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Handle asyncpg ssl
        if "oregon-postgres.render.com" in url and "ssl=" not in url and "sslmode=" not in url:
            connector = "&" if "?" in url else "?"
            url = f"{url}{connector}ssl=require"
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
