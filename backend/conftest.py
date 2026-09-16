import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import async_session_factory
from app.main import app


@pytest.fixture(scope="session")
async def db_session() -> AsyncSession:
    async with async_session_factory() as session:
        yield session


@pytest.fixture(scope="session")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
