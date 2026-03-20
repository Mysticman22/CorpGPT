import psycopg2
import bcrypt

conn = psycopg2.connect(host='localhost', dbname='corpgpt', user='postgres', password='Postgre12', port=5432)
cur = conn.cursor()
cur.execute("SELECT email, hashed_password, role, status FROM users WHERE email = 'admin@corpgpt.com'")
row = cur.fetchone()
if not row:
    print("ADMIN NOT FOUND IN DB")
else:
    email, hashed, role, status = row
    print(f"Email : {email}")
    print(f"Role  : {role}")
    print(f"Status: {status}")
    print(f"Hash  : {hashed}")
    match = bcrypt.checkpw(b'Admin@1234', hashed.encode('utf-8'))
    print(f"Password 'Admin@1234' matches hash: {match}")
cur.close()
conn.close()
