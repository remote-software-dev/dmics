#!/usr/bin/env python3
"""
Seed a single test user into the database.
Idempotent — skips if the user already exists.

Usage:
    python scripts/seed_user.py
    python scripts/seed_user.py --phone 089999999999 --password secret123
"""

import argparse
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend_app.core.config import get_settings
from backend_app.core.security import get_password_hash
from backend_app.models.models import User

settings = get_settings()


async def seed_user(phone: str, password: str, nama: str, email: str, province: str, position: str):
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        existing = await db.execute(select(User).where(User.username == phone))
        if existing.scalar_one_or_none() is not None:
            print(f"User '{phone}' already exists, skipping.")
            await engine.dispose()
            return

        user = User(
            username=phone,
            password=get_password_hash(password),
            nama=nama,
            email=email,
            phone=phone,
            province=province,
            kabupaten="Jakarta Pusat",
            position=position,
            legacy_hash="bcrypt",
        )
        db.add(user)
        await db.commit()
        print(f"Created user — Phone: {phone}, Password: {password}, Position: {position}")

    await engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Seed a test user into the database.")
    parser.add_argument("--phone", default="081234567890", help="Phone / username (default: 081234567890)")
    parser.add_argument("--password", default="password", help="Plain-text password (default: password)")
    parser.add_argument("--nama", default="Test User", help="Display name (default: Test User)")
    parser.add_argument("--email", default="admin@dmics.test", help="Email (default: admin@dmics.test)")
    parser.add_argument("--province", default="31", help="Province code (default: 31)")
    parser.add_argument("--position", default="admin", help="Position / role (default: admin)")
    args = parser.parse_args()

    asyncio.run(seed_user(
        phone=args.phone,
        password=args.password,
        nama=args.nama,
        email=args.email,
        province=args.province,
        position=args.position,
    ))


if __name__ == "__main__":
    main()
