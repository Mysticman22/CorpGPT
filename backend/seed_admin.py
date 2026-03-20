"""
Migration + Admin Seed Script
Adds missing columns to users table and creates the first admin account.
"""
import psycopg2
import uuid
import bcrypt

conn = psycopg2.connect(host='localhost', port=5432, dbname='corpgpt', user='postgres', password='Postgre12')
cur = conn.cursor()

# Step 1: Add missing columns if they don't exist
print("Checking and adding missing columns...")

migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number VARCHAR DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR DEFAULT 'Information Technology'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR DEFAULT 'Employee'",
]

for sql in migrations:
    try:
        cur.execute(sql)
        conn.commit()
        print(f"  OK: {sql[:60]}...")
    except Exception as e:
        conn.rollback()
        print(f"  SKIP: {e}")

# Step 2: Create admin user
print("\nCreating admin user...")

cur.execute("SELECT email FROM users WHERE email = %s", ('admin@corpgpt.com',))
if cur.fetchone():
    print("  Admin already exists!")
else:
    hashed = bcrypt.hashpw(b"Admin@1234", bcrypt.gensalt()).decode('utf-8')
    admin_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO users (id, email, hashed_password, full_name, contact_number, department, position, role, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
    """, (
        admin_id,
        'admin@corpgpt.com',
        hashed,
        'System Admin',
        '+91 00000 00000',
        'Information Technology',
        'C-Level Executive',
        'ADMIN',
        'ACTIVE'
    ))
    conn.commit()
    print("  SUCCESS! Admin account created.")
    print("  Email   : admin@corpgpt.com")
    print("  Password: Admin@1234")
    print("  Role    : ADMIN | Status: ACTIVE")

cur.close()
conn.close()
print("\nDone! You can now sign in at http://localhost:5173/login")
