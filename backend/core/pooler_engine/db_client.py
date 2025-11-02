import psycopg2

def execute_db_query(user_db, query):
    try:
        conn = psycopg2.connect(
            host=user_db.host,
            port=user_db.port,
            user=user_db.username,
            password=user_db.password,
            dbname=user_db.dbname,
        )
        cur = conn.cursor()
        cur.execute(query)
        try:
            result = cur.fetchall()
        except psycopg2.ProgrammingError:
            # No results to fetch (INSERT/UPDATE/DELETE)
            result = None
            conn.commit()
        conn.close()
        return result
    except Exception as e:
        print(f"Database error: {e}")
        raise  # Re-raise to handle in pooler
    finally:
        if conn:
            conn.close()