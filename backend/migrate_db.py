import asyncio
import sqlite3
from pathlib import Path


async def migrate_database():
    db_path = Path("profiles.db")
    
    if not db_path.exists():
        print("Database doesn't exist, will be created on next startup")
        return
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        cursor.execute("PRAGMA table_info(profiles)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'resume_path' not in columns:
            print("Adding resume_path column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN resume_path VARCHAR")
        
        if 'resume_data' not in columns:
            print("Adding resume_data column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN resume_data JSON")
        
        conn.commit()
        print("✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    asyncio.run(migrate_database())

