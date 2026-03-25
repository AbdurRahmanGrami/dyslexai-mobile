"""
Auth: SQLite DB for users. Passwords hashed with bcrypt; JWT for sessions.
"""
import os
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, String, Integer, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite in project directory (no extra DB server)
_dir = os.path.dirname(os.path.abspath(__file__))
_parent = os.path.dirname(_dir)
DB_PATH = os.environ.get("AUTH_DB_PATH", os.path.join(_parent, "dyslexai_auth.db"))
DB_PATH = os.path.abspath(DB_PATH)
_db_dir = os.path.dirname(DB_PATH)
if _db_dir:
    os.makedirs(_db_dir, exist_ok=True)
DATABASE_URL = f"sqlite:///{DB_PATH.replace(os.sep, '/')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_auth_db():
    Base.metadata.create_all(bind=engine)


def get_auth_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
