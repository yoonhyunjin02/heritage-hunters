# loader/unesco_csv_loader.py
import csv
from pathlib import Path
import argparse

from db.insert_heritages import insert_heritages
# (선택) 시대 텍스트 정규화가 필요하면 주석 해제
# from adapters.era_normalizer import normalize_era

REQUIRED_FIELDS = [
    "name", "era", "thumbnail_url", "designation",
    "region", "address", "latitude", "longitude", "description"
]

def load_unesco_csv(csv_path: str):
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV 파일을 찾을 수 없습니다: {csv_path}")

    records = []
    with open(path, "r", encoding="cp949", newline="") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED_FIELDS if c not in reader.fieldnames]
        if missing:
            raise ValueError(f"CSV에 필요한 컬럼이 없습니다: {missing}")

        for i, row in enumerate(reader, start=2):  # 2행부터 데이터(헤더 1행 가정)
            # name_hanja는 CSV에 없으니 None으로
            name_hanja = row.get("name_hanja") or None

            # (선택) 시대 정규화 사용 시
            era_raw = (row.get("era") or "").strip()
            era = era_raw  # normalize_era(era_raw)

            rec = {
                "name": (row.get("name") or "").strip(),
                "name_hanja": name_hanja,
                "thumbnail_url": (row.get("thumbnail_url") or "").strip() or None,
                "description": (row.get("description") or "").strip() or None,
                "designation": (row.get("designation") or "").strip() or None,
                "region": (row.get("region") or "").strip() or None,
                "address": (row.get("address") or "").strip() or None,
                "era": era,
                # latitude/longitude는 insert 단계에서 float 변환하므로 문자열 그대로 두되 빈 값은 None
                "latitude": (row.get("latitude") or None),
                "longitude": (row.get("longitude") or None),
            }

            # 필수값 체크(원하면 더 타이트하게)
            if not rec["name"]:
                print(f"[스킵] {i}행: name 없음")
                continue

            records.append(rec)

    if not records:
        print("[알림] 저장할 레코드가 없습니다.")
        return

    insert_heritages(records)


def main():
    # 경로를 직접 지정
    csv_path = r"C:/heritage-hunters/etl/data/unesco.csv"
    load_unesco_csv(csv_path)

if __name__ == "__main__":
    main()