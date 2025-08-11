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

def insert_spca(data_list):
    if not data_list:
        print("[ℹ] 저장할 데이터 없음")
        return

    sql = """
    INSERT INTO spca_stage (
        name, ccma_name, vloc_name, crltsno_nm, era, designated_at,
        category, manager, lat, lon, vloc_sido_name, vloc_sido_code, ccba_kdcd
    ) VALUES %s;
    """

    values = [
        (
            d.get("name"),
            d.get("ccma_name"),
            d.get("vloc_name"),
            d.get("crltsno_nm"),
            d.get("era"),
            d.get("designated_at"),
            d.get("category"),
            d.get("manager"),
            d.get("lat"),
            d.get("lon"),
            d.get("vloc_sido_name"),
            d.get("vloc_sido_code"),
            d.get("ccba_kdcd")
        )
        for d in data_list
    ]

    with get_connection() as conn:
        with conn.cursor() as cur:
            execute_values(cur, sql, values)
        conn.commit()
    print(f"[✅] {len(values)}건 저장 완료")
