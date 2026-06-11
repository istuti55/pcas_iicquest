import sqlite3
import os

DB_PATH = 'backend/palo.db'

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get current columns
    cursor.execute('PRAGMA table_info(tokens);')
    existing_columns = [row[1] for row in cursor.fetchall()]

    # Columns that should be there according to models.py
    required_columns = [
        ('service_date', 'DATETIME'),
        ('secret_token', 'VARCHAR'),
        ('verification_pin', 'VARCHAR'),
        ('estimated_reporting_time', 'VARCHAR'),
        ('risk_status', 'VARCHAR'),
        ('requires_confirmation', 'INTEGER DEFAULT 0'),
        ('is_confirmed', 'INTEGER DEFAULT 0'),
        ('reminder_sent', 'INTEGER DEFAULT 0'),
        ('initial_queue_depth', 'INTEGER')
    ]

    for col_name, col_type in required_columns:
        if col_name not in existing_columns:
            print(f"Adding column {col_name} to tokens table...")
            try:
                cursor.execute(f"ALTER TABLE tokens ADD COLUMN {col_name} {col_type};")
                conn.commit()
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")

    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
