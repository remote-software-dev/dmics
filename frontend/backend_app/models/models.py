import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend_app.core.database import Base


class Province(Base):
    __tablename__ = "provinces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    districts: Mapped[list["District"]] = relationship(back_populates="province")


class District(Base):
    __tablename__ = "districts"
    __table_args__ = (
        Index("ix_districts_province_id", "province_id"),
        Index("ix_districts_is_active", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    province_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("provinces.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    province: Mapped["Province"] = relationship(back_populates="districts")
    subdistricts: Mapped[list["Subdistrict"]] = relationship(back_populates="district")


class Subdistrict(Base):
    __tablename__ = "subdistricts"
    __table_args__ = (
        Index("ix_subdistricts_district_id", "district_id"),
        Index("ix_subdistricts_is_active", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    district_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    district: Mapped["District"] = relationship(back_populates="subdistricts")
    puskesmas: Mapped[list["Puskesmas"]] = relationship(back_populates="subdistrict")


class Puskesmas(Base):
    __tablename__ = "puskesmas"
    __table_args__ = (
        Index("ix_puskesmas_province_id", "province_id"),
        Index("ix_puskesmas_district_id", "district_id"),
        Index("ix_puskesmas_subdistrict_id", "subdistrict_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    province_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("provinces.id"), nullable=False)
    district_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=False)
    subdistrict_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subdistricts.id"), nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    created_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    province: Mapped["Province"] = relationship()
    district: Mapped["District"] = relationship()
    subdistrict: Mapped["Subdistrict"] = relationship(back_populates="puskesmas")


class ReportMR(Base):
    __tablename__ = "reportmr"
    __table_args__ = (
        Index("ix_reportmr_subdistrict_code", "subdistrict_code"),
        Index("ix_reportmr_date", "date"),
        Index("ix_reportmr_subdistrict_date", "subdistrict_code", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[str] = mapped_column(DateTime(timezone=False), nullable=False)
    subdistrict_code: Mapped[str] = mapped_column(String(10), ForeignKey("subdistricts.code"), nullable=False)
    id_puskesmas: Mapped[str] = mapped_column(String(20), ForeignKey("puskesmas.code"), nullable=False)
    dashboard_reporter: Mapped[str | None] = mapped_column(String(255))
    channel: Mapped[str] = mapped_column(String(50), default="dashboard")
    province: Mapped[str | None] = mapped_column(String(100))
    district: Mapped[str | None] = mapped_column(String(100))
    puskesmas: Mapped[str | None] = mapped_column(String(255))
    balita_mr: Mapped[int] = mapped_column(Integer, default=0)
    balita_mr_ori: Mapped[int | None] = mapped_column(Integer)
    date_ori: Mapped[str | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    campaign_type: Mapped[str] = mapped_column(String(10), default="mr")


class ReportOPV(Base):
    __tablename__ = "reportopv"
    __table_args__ = (
        Index("ix_reportopv_subdistrict_code", "subdistrict_code"),
        Index("ix_reportopv_date", "date"),
        Index("ix_reportopv_subdistrict_date", "subdistrict_code", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[str] = mapped_column(DateTime(timezone=False), nullable=False)
    subdistrict_code: Mapped[str] = mapped_column(String(10), ForeignKey("subdistricts.code"), nullable=False)
    id_puskesmas: Mapped[str] = mapped_column(String(20), ForeignKey("puskesmas.code"), nullable=False)
    dashboard_reporter: Mapped[str | None] = mapped_column(String(255))
    channel: Mapped[str] = mapped_column(String(50), default="dashboard")
    province: Mapped[str | None] = mapped_column(String(100))
    district: Mapped[str | None] = mapped_column(String(100))
    puskesmas: Mapped[str | None] = mapped_column(String(255))
    balita_opv: Mapped[int] = mapped_column(Integer, default=0)
    balita_opv_ori: Mapped[int | None] = mapped_column(Integer)
    date_ori: Mapped[str | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    campaign_type: Mapped[str] = mapped_column(String(10), default="opv")


class Population(Base):
    __tablename__ = "populations"
    __table_args__ = (
        Index("ix_populations_target_type", "target_type"),
        Index("ix_populations_target_code", "target_code"),
        Index("ix_populations_year", "year"),
        UniqueConstraint("target_type", "target_code", "campaign_type", "year", name="uq_populations"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_type: Mapped[str] = mapped_column(String(20), nullable=False)
    target_code: Mapped[str] = mapped_column(String(10), nullable=False)
    campaign_type: Mapped[str | None] = mapped_column(String(10))
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    extra_metadata: Mapped[dict | None] = mapped_column("metadata", JSON)
    created_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_province", "province"),
        Index("ix_users_subdistrict_code", "subdistrict_code"),
        Index("ix_users_position", "position"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    nama: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    province: Mapped[str | None] = mapped_column(String(10))
    kabupaten: Mapped[str | None] = mapped_column(String(100))
    subdistrict_code: Mapped[str | None] = mapped_column(String(10))
    id_puskesmas: Mapped[str | None] = mapped_column(String(20))
    position: Mapped[str | None] = mapped_column(String(100))
    datecreated: Mapped[str | None] = mapped_column(DateTime(timezone=True))
    password_updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True))
    legacy_hash: Mapped[str] = mapped_column(String(20), default="md5")
    created_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
