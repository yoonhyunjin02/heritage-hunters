# etl/match_update_from_spca.py
import argparse
from typing import List, Tuple
import psycopg2
from psycopg2.extras import execute_values

from config import DB_CONFIG
from db.heritage_match_exclude import is_excluded

def get_connection():
    return psycopg2.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        dbname=DB_CONFIG["dbname"],
    )

# 매칭 기준: name + designation(코드) + region(코드)
# 👉 designation/region은 문자열일 수 있어 안전 캐스팅
CANDIDATE_SQL = """
SELECT
    h.id                                         AS heritage_id,
    h.name                                       AS h_name,
    CASE WHEN TRIM(h.designation) ~ '^\d+$'
            THEN TRIM(h.designation)::int ELSE NULL END AS h_designation,
    CASE WHEN TRIM(h.region) ~ '^\d+$'
            THEN TRIM(h.region)::int ELSE NULL END      AS h_region,

    h.era                                         AS h_era,
    h.address                                     AS h_address,
    h.latitude                                    AS h_lat,
    h.longitude                                   AS h_lon,

    s.name                                        AS s_name,
    s.ccba_kdcd                                   AS s_designation,
    s.vloc_sido_code                              AS s_region,
    s.lat                                         AS s_lat,
    s.lon                                         AS s_lon,
    s.era                                         AS s_era,
    s.vloc_name                                   AS s_vloc_name
FROM heritages h
JOIN spca_stage s
    ON s.name = h.name
    AND s.ccba_kdcd =
        CASE WHEN TRIM(h.designation) ~ '^\d+$' THEN TRIM(h.designation)::int ELSE -1 END
    AND s.vloc_sido_code =
        CASE WHEN TRIM(h.region) ~ '^\d+$' THEN TRIM(h.region)::int ELSE -1 END
WHERE
    TRIM(h.designation) ~ '^\d+$'
AND TRIM(h.region)      ~ '^\d+$';
"""


def fetch_candidates(cur):
    cur.execute(CANDIDATE_SQL)
    cols = [d[0] for d in cur.description]
    for row in cur.fetchall():
        yield dict(zip(cols, row))

def build_updates(rows) -> List[Tuple[int, float, float, str, str]]:
    """
    업데이트 규칙(정규화 완료 기준):
        - latitude/longitude: h 값이 0일 때만 s 값으로 채움
        - era/address: h 값이 ''(빈 문자열)일 때만 s 값으로 채움
    """
    updates: List[Tuple[int, float, float, str, str]] = []

    for r in rows:
        if is_excluded(r["h_name"], r["h_designation"], r["h_region"]):
            continue

        # 좌표: 0일 때만 채움
        set_lat  = (r["h_lat"] == 0) and (r["s_lat"] not in (None, 0))
        set_lon  = (r["h_lon"] == 0) and (r["s_lon"] not in (None, 0))
        # 문자열: ''일 때만 채움 (NULL은 채우지 않음 — 정책에 따라 OR h_era IS NULL 추가 가능)
        set_era  = (r["h_era"] == '') and (r["s_era"] not in (None, ''))
        set_addr = (r["h_address"] == '') and (r["s_vloc_name"] not in (None, ''))

        if set_lat or set_lon or set_era or set_addr:
            updates.append((
                r["heritage_id"],
                r["s_lat"],                 # lat
                r["s_lon"],                 # lon
                r["s_era"] or None,         # era
                r["s_vloc_name"] or None    # addr
            ))
    return updates

# 0/''만 채우는 단순 규칙의 UPDATE
UPDATE_SQL = """
UPDATE heritages AS h
SET
    latitude  = CASE WHEN h.latitude  = 0 THEN v.lat  ELSE h.latitude  END,
    longitude = CASE WHEN h.longitude = 0 THEN v.lon  ELSE h.longitude END,
    era       = CASE WHEN h.era       = '' THEN v.era  ELSE h.era       END,
    address   = CASE WHEN h.address   = '' THEN v.addr ELSE h.address   END
FROM (
    VALUES %s
) AS v(id, lat, lon, era, addr)
WHERE h.id = v.id;
"""

def main(dry_run: bool):
    with get_connection() as conn, conn.cursor() as cur:
        candidates = list(fetch_candidates(cur))
        updates = build_updates(candidates)

        print(f"▶ 후보 {len(candidates)}건")
        print(f"▶ 업데이트 대상 {len(updates)}건 (0/'' 기준)")

        if dry_run or not updates:
            print("※ 드라이런 모드이거나 업데이트 대상이 없습니다. 종료.")
            return

        execute_values(cur, UPDATE_SQL, updates, page_size=1000)
        conn.commit()
        print("✅ 업데이트 완료")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="실제 UPDATE 없이 대상 건수만 출력")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
