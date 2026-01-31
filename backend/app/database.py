from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./profiles.db")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    import sqlite3
    from pathlib import Path
    
    db_path = Path("profiles.db")
    if db_path.exists():
        sync_conn = sqlite3.connect(str(db_path))
        cursor = sync_conn.cursor()
        try:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
            if not cursor.fetchone():
                pass
            
            cursor.execute("PRAGMA table_info(profiles)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'user_id' not in columns:
                cursor.execute("ALTER TABLE profiles ADD COLUMN user_id VARCHAR")
            
            if 'resume_path' not in columns:
                cursor.execute("ALTER TABLE profiles ADD COLUMN resume_path VARCHAR")
            
            if 'resume_data' not in columns:
                cursor.execute("ALTER TABLE profiles ADD COLUMN resume_data JSON")
            
            # Check if applications table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='applications'")
            if not cursor.fetchone():
                # Table will be created by SQLAlchemy on next run
                pass
            
            sync_conn.commit()
        except Exception as e:
            print(f"Migration warning: {e}")
            sync_conn.rollback()
        finally:
            sync_conn.close()

