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
            # 1. Guarantee tables are created
            Base.metadata.create_all(bind=engine)
            
            # 2. Seed default users
            db_temp = SessionLocal()
            try:
                from app.models.user import User
                from app.core.security import get_password_hash
                
                admin = db_temp.query(User).filter(User.email == "admin@quizforge.com").first()
                if not admin:
                    admin = User(
                        email="admin@quizforge.com",
                        hashed_password=get_password_hash("adminpassword123"),
                        full_name="Biswa Sarathi Subudhi (Admin)",
                        role="admin",
                        is_active=True
                    )
                    db_temp.add(admin)
                    
                student = db_temp.query(User).filter(User.email == "student@quizforge.com").first()
                if not student:
                    student = User(
                        email="student@quizforge.com",
                        hashed_password=get_password_hash("studentpassword123"),
                        full_name="Jane Doe (Student)",
                        role="student",
                        is_active=True
                    )
                    db_temp.add(student)
                db_temp.commit()
            except Exception as e:
                print(f"Error seeding default users: {e}")
            finally:
                db_temp.close()
        except Exception as e:
            print(f"Error initializing database: {e}")
        _db_initialized = True

    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()
