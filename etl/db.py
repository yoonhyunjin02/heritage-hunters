import psycopg2
from psycopg2.extras import execute_values
from config import DB_CONFIG  # 하드코딩된 DB 설정을 config.py에서 불러옴


def upsert_heritages(data: list[dict]):
    """heritages 테이블에 데이터 삽입 또는 갱신"""
    conn = psycopg2.connect(**DB_CONFIG)
    with conn:
        with conn.cursor() as cur:
            sql = """
            INSERT INTO heritages (
                id, name, name_en, thumbnail_url, description,
                designation, region, latitude, longitude, address, era
            )
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                name_en = EXCLUDED.name_en,
                thumbnail_url = EXCLUDED.thumbnail_url,
                description = EXCLUDED.description,
                designation = EXCLUDED.designation,
                region = EXCLUDED.region,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                address = EXCLUDED.address,
                era = EXCLUDED.era;
            """
            values = [
                (
                    d["id"],
                    d["name"],
                    d.get("name_en"),
                    d.get("thumbnail_url"),
                    d.get("description"),
                    d.get("designation"),
                    d.get("region"),
                    d.get("latitude"),
                    d.get("longitude"),
                    d.get("address"),
                    d.get("era"),
                )
                for d in data
            ]
            execute_values(cur, sql, values)
    print("✅ heritages 테이블 저장 완료")


# def upsert_museums(data: list[dict]):
#     """museums 테이블에 데이터 삽입 또는 갱신"""
#     conn = psycopg2.connect(**DB_CONFIG)
#     with conn:
#         with conn.cursor() as cur:
#             sql = """
#             INSERT INTO museums (
#                 name, category, latitude, longitude,
#                 address, region, description
#             )
#             VALUES %s
#             ON CONFLICT (name) DO UPDATE SET
#                 category = EXCLUDED.category,
#                 latitude = EXCLUDED.latitude,
#                 longitude = EXCLUDED.longitude,
#                 address = EXCLUDED.address,
#                 region = EXCLUDED.region,
#                 description = EXCLUDED.description;
#             """
#             values = [
#                 (
#                     d["name"],
#                     d.get("category"),
#                     d.get("latitude"),
#                     d.get("longitude"),
#                     d.get("address"),
#                     d.get("region"),
#                     d.get("description"),
#                 )
#                 for d in data
#             ]
#             execute_values(cur, sql, values)
#     print("✅ museums 테이블 저장 완료")


# 연결 테스트
if __name__ == "__main__":
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ DB 연결 성공")
        conn.close()
    except Exception as e:
        print("❌ DB 연결 실패:", e)