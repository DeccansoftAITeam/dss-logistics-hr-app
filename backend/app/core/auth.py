"""
Authentication and permission enforcement via Clerk JWT and database UserProfiles.
Roles: Admin, HR, User.
Status: verified, pending_approval, rejected.
"""

import logging
import time
from typing import Annotated

import httpx
import jwt
from fastapi import Depends, Header
from pydantic import BaseModel
from sqlalchemy import select

from app.core.config import get_settings
from app.core.db import async_session_factory
from app.core.errors import ForbiddenError, UnauthorizedError
from app.features.models import UserProfile

logger = logging.getLogger(__name__)

settings = get_settings()

# In-memory cache for (email): (UserProfileDict, expire_timestamp)
_USER_CACHE: dict[str, tuple[dict, float]] = {}


def invalidate_user_cache(email: str | None = None) -> None:
    """Clear cached profile for a specific email or all users."""
    if email:
        _USER_CACHE.pop(email.strip().lower(), None)
    else:
        _USER_CACHE.clear()


# Cached JWKS client / keys
_JWKS_CACHE: dict[str, any] = {}
_JWKS_LAST_FETCH: float = 0


class AuthenticatedUser(BaseModel):
    user_id: str
    email: str = ""
    full_name: str = ""
    role: str = "User"  # Admin, HR, User
    status: str = "verified"  # verified, pending_approval, rejected
    org_id: str
    permissions: list[str] = []
    allowed_groups: list[str] = []
    is_hr_ops: bool = False


def resolve_role_permissions(role: str) -> tuple[list[str], bool]:
    """
    Map simple 3-tier role (Admin, HR, User) to audience groups and HR Ops flag.
    """
    if role == "Admin":
        return [
            "all-employees",
            "india-employees",
            "us-employees",
            "hr-managers",
            "people-managers",
        ], True
    elif role == "HR":
        return [
            "all-employees",
            "india-employees",
            "us-employees",
            "hr-managers",
        ], True
    else:  # User
        return [
            "all-employees",
            "india-employees",
            "us-employees",
        ], False


async def fetch_jwks(jwks_url: str) -> dict:
    global _JWKS_CACHE, _JWKS_LAST_FETCH
    now = time.time()
    if _JWKS_CACHE and (now - _JWKS_LAST_FETCH < 3600):
        return _JWKS_CACHE

    try:
        headers = {"User-Agent": "DSS-Ask-Policy-Backend/1.0"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(jwks_url, headers=headers)
            resp.raise_for_status()
            _JWKS_CACHE = resp.json()
            _JWKS_LAST_FETCH = now
            return _JWKS_CACHE
    except Exception as e:
        logger.error("Failed to fetch Clerk JWKS from %s: %s", jwks_url, e)
        if _JWKS_CACHE:
            return _JWKS_CACHE
        raise UnauthorizedError(title="Authentication service unavailable")


async def get_or_register_user_profile(
    email: str,
    full_name: str = "",
    clerk_user_id: str | None = None,
) -> dict:
    """
    Fetch user from PostgreSQL by email. If absent, auto-create as pending_approval.
    """
    clean_email = email.lower().strip()
    now = time.time()

    if clean_email in _USER_CACHE:
        cached_data, expire_at = _USER_CACHE[clean_email]
        if now < expire_at:
            return cached_data

    async with async_session_factory() as session:
        res = await session.execute(
            select(UserProfile).where(UserProfile.email == clean_email)
        )
        user = res.scalars().first()
        if not user:
            # First-time login: create as pending_approval
            display_name = full_name or clean_email.split("@")[0]
            user = UserProfile(
                email=clean_email,
                full_name=display_name,
                role="User",
                status="pending_approval",
                clerk_user_id=clerk_user_id,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            logger.info("Auto-registered new user: %s (pending_approval)", clean_email)
        # Keep the profile linked to the Clerk identity when it arrives.
        if clerk_user_id and not user.clerk_user_id:
            user.clerk_user_id = clerk_user_id

        # Bootstrap: first user whose email matches ADMIN_BOOTSTRAP_EMAIL becomes
        # a verified Admin automatically (one-click participant deployments).
        if (
            settings.admin_bootstrap_email
            and email == settings.admin_bootstrap_email.strip().lower()
            and user.role != "Admin"
        ):
            user.role = "Admin"
            user.status = "verified"
            logger.info("Bootstrapped %s as verified Admin (ADMIN_BOOTSTRAP_EMAIL match).", email)
        elif clerk_user_id and not user.clerk_user_id:
            pass  # already assigned above

        if session.dirty:
            await session.commit()
            await session.refresh(user)

        user_dict = {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "clerk_user_id": user.clerk_user_id,
        }
        _USER_CACHE[clean_email] = (user_dict, now + 300)  # 5-minute cache
        return user_dict


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    x_clerk_user_id: Annotated[str | None, Header()] = None,
    x_clerk_user_email: Annotated[str | None, Header()] = None,
    x_clerk_user_name: Annotated[str | None, Header()] = None,
    x_clerk_org_id: Annotated[str | None, Header()] = None,
    x_clerk_permissions: Annotated[str | None, Header()] = None,
) -> AuthenticatedUser:
    """
    Authenticate user via Clerk JWT Bearer token or BFF headers.
    Resolves permissions from the database UserProfile by email, with fallback
    support for x-clerk-permissions headers in integration tests.
    """
    user_id = x_clerk_user_id or "anonymous"
    email = (x_clerk_user_email or "").strip().lower()
    name = x_clerk_user_name or ""
    org_id = x_clerk_org_id or settings.clerk_org_id

    # If Authorization Bearer token is provided, extract claims
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            unverified_claims = jwt.decode(token, options={"verify_signature": False})
            user_id = unverified_claims.get("sub") or user_id
            token_email = unverified_claims.get("email") or unverified_claims.get("primary_email_address")
            if token_email and not email:
                email = token_email.strip().lower()
            org_id = unverified_claims.get("org_id", org_id)
        except Exception as e:
            logger.warning("Unverified claims decode warning: %s", e)

    # If email is known, look up database profile
    if email:
        profile = await get_or_register_user_profile(
            email=email, full_name=name, clerk_user_id=user_id
        )
        role = profile["role"]
        status = profile["status"]
        full_name = profile["full_name"]

        if status == "verified":
            allowed_groups, is_hr_ops = resolve_role_permissions(role)
        else:
            allowed_groups = []
            is_hr_ops = False

        return AuthenticatedUser(
            user_id=user_id,
            email=email,
            full_name=full_name,
            role=role,
            status=status,
            org_id=org_id,
            permissions=[f"org:role:{role.lower()}"],
            allowed_groups=allowed_groups,
            is_hr_ops=is_hr_ops,
        )

    # Fallback for dev / integration tests passing x-clerk-permissions
    perm_list = [p.strip() for p in (x_clerk_permissions or "").split(",") if p.strip()]
    is_admin = "org:role:admin" in perm_list
    is_hr = is_admin or "org:role:hr-ops" in perm_list or any("hr-managers" in p for p in perm_list)
    role = "Admin" if is_admin else ("HR" if is_hr else "User")

    if is_hr:
        allowed_groups, is_hr_ops = resolve_role_permissions(role)
    else:
        allowed_groups = ["all-employees", "india-employees", "us-employees"]
        is_hr_ops = False

    return AuthenticatedUser(
        user_id=user_id,
        email="guest@dsslogistics.example",
        full_name="Guest User",
        role=role,
        status="verified",
        org_id=org_id,
        permissions=perm_list or [f"org:role:{role.lower()}"],
        allowed_groups=allowed_groups,
        is_hr_ops=is_hr_ops,
    )


def require_hr_ops(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> AuthenticatedUser:
    """Restrict endpoint access to verified HR or Admin users."""
    if user.status != "verified" or not user.is_hr_ops:
        raise ForbiddenError(
            title="Access denied",
            detail="This operation requires verified HR or Administrator access.",
        )
    return user


def require_admin(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> AuthenticatedUser:
    """Restrict endpoint access strictly to verified System Administrators."""
    if user.status != "verified" or user.role != "Admin":
        raise ForbiddenError(
            title="Access denied",
            detail="This operation requires System Administrator role (Admin).",
        )
    return user
