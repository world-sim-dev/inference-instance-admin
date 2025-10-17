#!/usr/bin/env python3
"""
Database migration script for inference instances.
Handles schema changes and data migration between versions.
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from datetime import datetime

def get_database_info():
    """Get database connection and basic info."""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./inference_instances.db")
    engine = create_engine(database_url)
    
    return engine, database_url

def check_table_exists(engine, table_name):
    """Check if a table exists in the database."""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def get_table_columns(engine, table_name):
    """Get column information for a table."""
    inspector = inspect(engine)
    if table_name in inspector.get_table_names():
        return [col['name'] for col in inspector.get_columns(table_name)]
    return []

def migrate_priority_column(engine):
    """Migrate priorities column to priority column for both main and history tables."""
    print("Checking for priority column migration...")
    
    # Migrate main table
    columns = get_table_columns(engine, 'inference_instances')
    
    if 'priorities' in columns and 'priority' not in columns:
        print("Found 'priorities' column in main table, migrating to 'priority'...")
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            try:
                # Add new priority column
                conn.execute(text("ALTER TABLE inference_instances ADD COLUMN priority VARCHAR(20) DEFAULT 'medium'"))
                
                # Copy data from priorities to priority (handle JSON column)
                if engine.dialect.name == 'postgresql':
                    # For PostgreSQL with JSON column
                    conn.execute(text("""
                        UPDATE inference_instances 
                        SET priority = CASE 
                            WHEN priorities::text = '"urgent"' THEN 'critical'
                            WHEN priorities::text = '"high"' THEN 'high'
                            WHEN priorities::text = '"normal"' THEN 'medium'
                            WHEN priorities::text = '"low"' THEN 'low'
                            WHEN priorities::text LIKE '%urgent%' THEN 'critical'
                            WHEN priorities::text LIKE '%high%' THEN 'high'
                            WHEN priorities::text LIKE '%normal%' THEN 'medium'
                            WHEN priorities::text LIKE '%low%' THEN 'low'
                            ELSE 'medium'
                        END
                    """))
                else:
                    # For other databases
                    conn.execute(text("""
                        UPDATE inference_instances 
                        SET priority = CASE 
                            WHEN priorities = 'urgent' THEN 'critical'
                            WHEN priorities = 'high' THEN 'high'
                            WHEN priorities = 'normal' THEN 'medium'
                            WHEN priorities = 'low' THEN 'low'
                            ELSE 'medium'
                        END
                    """))
                
                # Drop old priorities column (PostgreSQL)
                if engine.dialect.name == 'postgresql':
                    conn.execute(text("ALTER TABLE inference_instances DROP COLUMN priorities"))
                
                trans.commit()
                print("✅ Main table priority column migration completed successfully")
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Main table priority column migration failed: {str(e)}")
                raise
                
    elif 'priority' in columns:
        print("✅ Main table priority column already exists, no migration needed")
    else:
        print("⚠️  Neither 'priorities' nor 'priority' column found in main table")
    
    # Migrate history table
    history_columns = get_table_columns(engine, 'inference_instances_history')
    
    if 'priorities' in history_columns and 'priority' not in history_columns:
        print("Found 'priorities' column in history table, migrating to 'priority'...")
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            try:
                # Add new priority column
                conn.execute(text("ALTER TABLE inference_instances_history ADD COLUMN priority VARCHAR(20) DEFAULT 'medium'"))
                
                # Copy data from priorities to priority (handle JSON column)
                if engine.dialect.name == 'postgresql':
                    # For PostgreSQL with JSON column
                    conn.execute(text("""
                        UPDATE inference_instances_history 
                        SET priority = CASE 
                            WHEN priorities::text = '"urgent"' THEN 'critical'
                            WHEN priorities::text = '"high"' THEN 'high'
                            WHEN priorities::text = '"normal"' THEN 'medium'
                            WHEN priorities::text = '"low"' THEN 'low'
                            WHEN priorities::text LIKE '%urgent%' THEN 'critical'
                            WHEN priorities::text LIKE '%high%' THEN 'high'
                            WHEN priorities::text LIKE '%normal%' THEN 'medium'
                            WHEN priorities::text LIKE '%low%' THEN 'low'
                            ELSE 'medium'
                        END
                    """))
                else:
                    # For other databases
                    conn.execute(text("""
                        UPDATE inference_instances_history 
                        SET priority = CASE 
                            WHEN priorities = 'urgent' THEN 'critical'
                            WHEN priorities = 'high' THEN 'high'
                            WHEN priorities = 'normal' THEN 'medium'
                            WHEN priorities = 'low' THEN 'low'
                            ELSE 'medium'
                        END
                    """))
                
                # Drop old priorities column (PostgreSQL)
                if engine.dialect.name == 'postgresql':
                    conn.execute(text("ALTER TABLE inference_instances_history DROP COLUMN priorities"))
                
                trans.commit()
                print("✅ History table priority column migration completed successfully")
                
            except Exception as e:
                trans.rollback()
                print(f"❌ History table priority column migration failed: {str(e)}")
                raise
                
    elif 'priority' in history_columns:
        print("✅ History table priority column already exists, no migration needed")
    else:
        print("⚠️  Neither 'priorities' nor 'priority' column found in history table")

def migrate_missing_columns(engine):
    """Add any missing columns to existing tables."""
    print("Checking for missing columns...")
    
    # Check main table
    columns = get_table_columns(engine, 'inference_instances')
    
    # Define expected columns with their SQL definitions
    expected_columns = {
        'model_version': "VARCHAR(50) DEFAULT 'latest'",
        'pp': "INTEGER DEFAULT 1",
        'cp': "INTEGER DEFAULT 8", 
        'tp': "INTEGER DEFAULT 1",
        'status': "VARCHAR(50) DEFAULT 'active'",
        'priority': "VARCHAR(20) DEFAULT 'medium'",
        'description': "TEXT DEFAULT ''"
    }
    
    missing_columns = []
    for col_name, col_def in expected_columns.items():
        if col_name not in columns:
            missing_columns.append((col_name, col_def))
    
    if missing_columns:
        print(f"Found {len(missing_columns)} missing columns in main table: {[col[0] for col in missing_columns]}")
        
        with engine.connect() as conn:
            trans = conn.begin()
            try:
                for col_name, col_def in missing_columns:
                    print(f"  Adding column to main table: {col_name}")
                    conn.execute(text(f"ALTER TABLE inference_instances ADD COLUMN {col_name} {col_def}"))
                
                trans.commit()
                print("✅ Missing columns added to main table successfully")
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Adding missing columns to main table failed: {str(e)}")
                raise
    else:
        print("✅ All expected columns are present in main table")
    
    # Check history table
    history_columns = get_table_columns(engine, 'inference_instances_history')
    
    # Define expected history columns (same as main table but without defaults)
    expected_history_columns = {
        'model_version': "VARCHAR(50)",
        'pp': "INTEGER",
        'cp': "INTEGER", 
        'tp': "INTEGER",
        'status': "VARCHAR(50)",
        'priority': "VARCHAR(20)",
        'description': "TEXT"
    }
    
    missing_history_columns = []
    for col_name, col_def in expected_history_columns.items():
        if col_name not in history_columns:
            missing_history_columns.append((col_name, col_def))
    
    if missing_history_columns:
        print(f"Found {len(missing_history_columns)} missing columns in history table: {[col[0] for col in missing_history_columns]}")
        
        with engine.connect() as conn:
            trans = conn.begin()
            try:
                for col_name, col_def in missing_history_columns:
                    print(f"  Adding column to history table: {col_name}")
                    conn.execute(text(f"ALTER TABLE inference_instances_history ADD COLUMN {col_name} {col_def}"))
                
                trans.commit()
                print("✅ Missing columns added to history table successfully")
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Adding missing columns to history table failed: {str(e)}")
                raise
    else:
        print("✅ All expected columns are present in history table")

def create_history_table_if_missing(engine):
    """Create history table if it doesn't exist."""
    if not check_table_exists(engine, 'inference_instances_history'):
        print("Creating inference_instances_history table...")
        
        # Import and create tables
        from models import create_tables
        create_tables(engine)
        print("✅ History table created successfully")
    else:
        print("✅ History table already exists")

def verify_migration(engine):
    """Verify that migration was successful."""
    print("Verifying migration...")
    
    try:
        # Test basic query
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM inference_instances"))
            count = result.scalar()
            print(f"✅ Can query inference_instances table: {count} records")
            
            # Check if history table works
            result = conn.execute(text("SELECT COUNT(*) FROM inference_instances_history"))
            history_count = result.scalar()
            print(f"✅ Can query inference_instances_history table: {history_count} records")
            
        return True
        
    except Exception as e:
        print(f"❌ Migration verification failed: {str(e)}")
        return False

def main():
    """Main migration function."""
    print("=" * 60)
    print("Database Migration Script")
    print("=" * 60)
    
    try:
        engine, database_url = get_database_info()
        print(f"Database URL: {database_url}")
        print(f"Database Type: {database_url.split('://')[0]}")
        print("-" * 60)
        
        # Check if main table exists
        if not check_table_exists(engine, 'inference_instances'):
            print("Main table doesn't exist, creating all tables...")
            from models import create_tables
            create_tables(engine)
            print("✅ All tables created successfully")
        else:
            print("Main table exists, checking for migrations...")
            
            # Run migrations
            migrate_priority_column(engine)
            migrate_missing_columns(engine)
            create_history_table_if_missing(engine)
        
        print("-" * 60)
        
        # Verify migration
        if verify_migration(engine):
            print("✅ Migration completed successfully!")
            print(f"Migration completed at: {datetime.now().isoformat()}")
            return True
        else:
            print("❌ Migration verification failed!")
            return False
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)