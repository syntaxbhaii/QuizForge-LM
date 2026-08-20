from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# For SQLite (in case we need testing/fallback) or PostgreSQL
connect_args = {}
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


_db_initialized = False


def get_db() -> Generator:
    global _db_initialized
    if not _db_initialized:
        try:
            try:
                from seed import seed_database
            except ImportError:
                import sys
                import os
                sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
                from seed import seed_database
            seed_database()
        except Exception as e:
            print(f"Database seeding bypass/error: {e}")
        _db_initialized = True

    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()
