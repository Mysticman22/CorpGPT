import psycopg2
import bcrypt
import uuid
from datetime import datetime

# DB Config
conn = psycopg2.connect(host='localhost', dbname='corpgpt', user='postgres', password='Postgre12', port=5432)
cur = conn.cursor()

# 1. Create a Global Headquarters Department
hq_id = str(uuid.uuid4())
cur.execute(
    "INSERT INTO departments (id, name, created_at) VALUES (%s, %s, %s) RETURNING id",
    (hq_id, "Headquarters", datetime.utcnow())
)
print(f"Created Department 'Headquarters' with ID: {hq_id}")

# 2. Create the Super Admin User
admin_id = str(uuid.uuid4())
password = b'Admin@1234'
hashed = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

cur.execute(
    """
    INSERT INTO users (id, email, hashed_password, full_name, contact_number, department_id, position, role, status, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """,
    (
        admin_id,
        "admin@corpgpt.com",
        hashed,
        "System Admin",
        "+1-555-0101",
        hq_id,          # Using the new department ID
        "C-Level Executive",
        "SUPER_ADMIN",
        "ACTIVE",
        datetime.utcnow()
    )
)
print("Created SUPER_ADMIN user: admin@corpgpt.com")

conn.commit()
cur.close()
conn.close()
