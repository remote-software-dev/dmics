from collections.abc import AsyncGenerator

import ssl
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

_engine = None
_session_factory = None


def _get_engine():
    global _engine, _session_factory
    if _engine is not None:
        return _engine, _session_factory

    from backend_app.core.config import get_settings
    settings = get_settings()
    url = settings.DATABASE_URL

    _engine_kwargs = {"echo": False, "pool_pre_ping": True}
    if url.startswith("sqlite"):
        pass
    else:
        _engine_kwargs["pool_size"] = 5
        _engine_kwargs["max_overflow"] = 2
    if "neon.tech" in url:
        _engine_kwargs["connect_args"] = {"ssl": ssl.create_default_context()}

    _engine = create_async_engine(url, **_engine_kwargs)
    _session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)
    return _engine, _session_factory


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    _, sf = _get_engine()
    async with sf() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
