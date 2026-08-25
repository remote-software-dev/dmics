from collections.abc import AsyncGenerator
import logging
import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)

_engine = None
_session_factory = None


def _get_engine():
    global _engine, _session_factory
    if _engine is not None:
        return _engine, _session_factory

    from backend_app.core.config import get_settings
    settings = get_settings()
    url = settings.DATABASE_URL

    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Set POSTGRES_URL or DATABASE_URL in environment variables."
        )

    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    _engine_kwargs = {"echo": False, "pool_pre_ping": True}
    if url.startswith("sqlite"):
        pass
    else:
        _engine_kwargs["pool_size"] = 5
        _engine_kwargs["max_overflow"] = 2
    if "neon.tech" in url or "sslmode" in url:
        _engine_kwargs["connect_args"] = {"ssl": ssl.create_default_context()}

    _engine = create_async_engine(url, **_engine_kwargs)
    _session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)
    return _engine, _session_factory


async def get_async_session_factory():
    _, sf = _get_engine()
    return sf


async def create_tables():
    engine, _ = _get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified.")


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
