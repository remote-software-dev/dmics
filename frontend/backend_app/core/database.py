from collections.abc import AsyncGenerator

import ssl
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend_app.core.config import get_settings

settings = get_settings()

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_is_neon = "neon.tech" in settings.DATABASE_URL

_engine_kwargs = {"echo": False, "pool_pre_ping": True}

if _is_sqlite:
    pass
else:
    _engine_kwargs["pool_size"] = 5
    _engine_kwargs["max_overflow"] = 2

if _is_neon:
    _engine_kwargs["connect_args"] = {"ssl": ssl.create_default_context()}

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
