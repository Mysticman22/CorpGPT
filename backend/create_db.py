import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    # Connect to the default 'postgres' database to issue the CREATE DATABASE command
    print("Connecting to PostgreSQL...")
    conn = psycopg2.connect(user="postgres", password="Postgre12", host="localhost", port="5432", database="postgres")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    
    cursor = conn.cursor()
    print("Creating 'corpgpt' database...")
    cursor.execute('CREATE DATABASE corpgpt')
    
    cursor.close()
    conn.close()
    print("Database 'corpgpt' created successfully!")
except psycopg2.errors.DuplicateDatabase:
    print("Database 'corpgpt' already exists!")
except Exception as e:
    print(f"Error creating database: {e}")
