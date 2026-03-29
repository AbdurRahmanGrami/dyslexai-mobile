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
    # Role is used to route users to student vs teacher UIs on the client.
    # We default to 'student' so existing users keep working.
    role = Column(String(32), nullable=False, default="student")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_auth_db():
    Base.metadata.create_all(bind=engine)

    # SQLite migration for existing DBs:
    # add users.role if this DB was created before role support.
    try:
        with engine.connect() as conn:
            rows = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
            existing_cols = {r[1] for r in rows}  # (cid, name, type, notnull, dflt_value, pk)
            if "role" not in existing_cols:
                conn.exec_driver_sql(
                    "ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'student'"
                )
                conn.commit()
    except Exception as e:
        # Keep server startup alive, but surface migration failures for debugging.
        print(f"[auth_db] role migration skipped/failed: {e}")


def get_auth_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
