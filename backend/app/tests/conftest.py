import os
os.environ["TESTING"] = "True"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User

# Use an isolated SQLite file or in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_db.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Pre-seed a test admin and student
    db = TestingSessionLocal()
    try:
        admin = User(
            email="test_admin@quizforge.com",
            hashed_password=get_password_hash("testadmin123"),
            full_name="Test Admin",
            role="admin",
            is_active=True
        )
        student = User(
            email="test_student@quizforge.com",
            hashed_password=get_password_hash("teststudent123"),
            full_name="Test Student",
            role="student",
            is_active=True
        )
        db.add_all([admin, student])
        db.commit()
    finally:
        db.close()
        
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
