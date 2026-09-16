from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from sqlalchemy.pool import NullPool
from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    poolclass=NullPool,
)

async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base declarative class for all models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database session."""
    async with async_session_factory() as session:
        yield session
