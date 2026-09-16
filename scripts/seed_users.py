"""
Create user_profiles table and seed the 4 authorized Google accounts.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import select, text
from app.core.db import async_session_factory, engine, Base
from app.features.models import UserProfile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ACCOUNTS = [
    {
        "email": "aiteam@deccansoft.net",
        "full_name": "Deccansoft AI Team",
        "role": "Admin",
        "status": "verified",
    },
    {
        "email": "suresh42326@gmail.com",
        "full_name": "Suresh",
        "role": "HR",
        "status": "verified",
    },
    {
        "email": "emailforfriendsss@gmail.com",
        "full_name": "US Operations",
        "role": "User",
        "status": "verified",
    },
    {
        "email": "ainews@deccansoft.net",
        "full_name": "AI News Team",
        "role": "User",
        "status": "verified",
    },
]


async def seed_users():
    logger.info("Ensuring user_profiles table exists in PostgreSQL...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Table verification complete.")

    async with async_session_factory() as session:
        for acc in ACCOUNTS:
            email = acc["email"].lower().strip()
            res = await session.execute(
                select(UserProfile).where(UserProfile.email == email)
            )
            existing = res.scalars().first()
            if existing:
                existing.full_name = acc["full_name"]
                existing.role = acc["role"]
                existing.status = acc["status"]
                logger.info("Updated existing user: %s (%s - %s)", email, acc["role"], acc["status"])
            else:
                user = UserProfile(
                    email=email,
                    full_name=acc["full_name"],
                    role=acc["role"],
                    status=acc["status"],
                )
                session.add(user)
                logger.info("Created new user: %s (%s - %s)", email, acc["role"], acc["status"])

        await session.commit()
    logger.info("Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_users())
