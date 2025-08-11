import psycopg2
from psycopg2.extras import execute_values
from config import DB_CONFIG

def get_connection():
    return psycopg2.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        dbname=DB_CONFIG["dbname"]
    )

def insert_museums(museum_list):
    if not museum_list:
        print("🚫 저장할 데이터가 없습니다.")
        return

    insert_sql = """
    INSERT INTO museums (
        name, category, latitude, longitude,
        address, region, description
    ) VALUES %s;
    """

    values = []
    for m in museum_list:
        values.append((
            m.get("name"),
            m.get("category"),
            m.get("latitude"),
            m.get("longitude"),
            m.get("address"),
            m.get("region"),
            m.get("description")
        ))

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                execute_values(cur, insert_sql, values)
            conn.commit()
        print(f"✅ DB 저장 완료: {len(values)}건")
    except Exception as e:
        print(f"[❌ DB 저장 실패] {e}")
