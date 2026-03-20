import psycopg2
conn = psycopg2.connect(host='localhost', port=5432, dbname='corpgpt', user='admin', password='password')
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tables = [r[0] for r in cur.fetchall()]
print("Tables:")
for t in tables:
    print(" -", t)
cur.close()
conn.close()
