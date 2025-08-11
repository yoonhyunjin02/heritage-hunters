# DB에서 heritages를 읽어 era_detail → era를 채우는 실행 스크립트.
import argparse, csv, math, time
from adapters.era_normalizer import load_rules, extract_era
from db.spca_db import get_connection  # 기존 커넥션 유틸

def chunked(iterable, size):
    for i in range(0, len(iterable), size):
        yield iterable[i:i+size]

def backfill(yml_path: str, limit: int|None, dry_run: bool, report: str|None, fill_unknown: bool, batch_size: int = 500):
    rules = load_rules(yml_path)
    conn = get_connection(); conn.autocommit = False
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT id, era_detail
                FROM heritages
                WHERE (era IS NULL OR era = '')
                  AND (era_detail IS NOT NULL AND era_detail <> '')
                ORDER BY id
            """
            if limit:
                sql += f" LIMIT {int(limit)}"
            cur.execute(sql)
            rows = cur.fetchall()

        updates, unknowns = [], []
        total = len(rows)
        print(f"[load] 대상 레코드 {total}건 로드 완료")

        # 매핑/분류
        t0 = time.time()
        for idx, (_id, detail) in enumerate(rows, start=1):
            era = extract_era(detail, rules)
            if era:
                updates.append((era, _id))
            else:
                if fill_unknown:
                    updates.append(("시대미상", _id))
                unknowns.append((_id, detail))

            if idx % 500 == 0:
                elapsed = time.time() - t0
                print(f"[map] {idx}/{total} 처리 (업데이트 예정 {len(updates)}건, 미상 {len(unknowns)}건, {elapsed:.1f}s)")

        # 리포트
        if report:
            with open(report, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(["id","era_detail"])
                w.writerows(unknowns)
            print(f"[report] 미상 {len(unknowns)}건을 '{report}'에 저장")

        if dry_run:
            print(f"[DRY-RUN] 업데이트 예정 {len(updates)}건 (미상 {len(unknowns)}건, fill_unknown={fill_unknown})")
            conn.rollback()
            return

        # --- 여기서부터 배치 UPDATE ---
        if not updates:
            print("[update] 업데이트할 항목이 없습니다.")
            conn.commit()
            return

        total_batches = math.ceil(len(updates) / batch_size)
        print(f"[update] 총 {len(updates)}건, 배치 {total_batches}개 (batch_size={batch_size})로 업데이트 시작")

        applied = 0
        for bi, batch in enumerate(chunked(updates, batch_size), start=1):
            try:
                with conn.cursor() as cur:
                    cur.executemany("UPDATE heritages SET era=%s WHERE id=%s", batch)
                conn.commit()  # 배치 단위 커밋 (락 오래 쥐지 않게)
                applied += len(batch)
                print(f"[update] 배치 {bi}/{total_batches} 커밋 완료 (+{len(batch)}건 누적 {applied}/{len(updates)})")
            except Exception as e:
                conn.rollback()
                # 문제 배치 내용 간단 요약
                example = batch[:3]
                print(f"[ERROR] 배치 {bi}/{total_batches}에서 실패. 롤백했습니다. 예시 rows={example}")
                raise

        print(f"[done] 업데이트 {applied}건 완료, 미상 {len(unknowns)}건 (report={report}, fill_unknown={fill_unknown})")

    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"[FATAL] 처리 중 예외 발생: {type(e).__name__}: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--rules", default="loader/era_rules.yml")
    p.add_argument("--limit", type=int)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--report", help="매칭 실패 목록 CSV 경로")
    p.add_argument("--fill-unknown", action="store_true", help="매칭 실패는 '시대미상'으로 채움")
    p.add_argument("--batch-size", type=int, default=500, help="UPDATE 배치 크기")
    args = p.parse_args()
    backfill(args.rules, args.limit, args.dry_run, args.report, args.fill_unknown, args.batch_size)
