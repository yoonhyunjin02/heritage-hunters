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

def insert_heritages(heritage_list):
    insert_sql = """
    INSERT INTO heritages (
        name, name_hanja, thumbnail_url, description,
        designation, region, address, era, latitude, longitude
    ) VALUES %s;
    """

    values = []
    for h in heritage_list:
        try:
            values.append((
                h.get("name"),
                h.get("name_hanja"),
                h.get("thumbnail_url"),
                h.get("description"),
                h.get("designation") or None,
                h.get("region") or None,
                h.get("address"),
                h.get("era"),
                float(h["latitude"]) if h.get("latitude") else None,
                float(h["longitude"]) if h.get("longitude") else None
            ))
        except Exception as e:
            print(f"[데이터 변환 오류] {h.get('name')} | {e}")

    if not values:
        print("[알림] 저장할 데이터 없음")
        return

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                execute_values(cur, insert_sql, values)
            conn.commit()
        print(f"[✅ DB 저장 완료] {len(values)}건")
    except Exception as e:
        print(f"[❌ DB 저장 실패] {e}")