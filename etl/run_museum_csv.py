import pandas as pd

from loader.museum_csv_loader import load_museum_csv, convert_df_to_museums
from db.insert_museums import insert_museums

# 1️⃣ CSV 경로
file_path = "data/전국박물관미술관정보표준데이터.csv"

# 2️⃣ CSV 로딩
df = load_museum_csv(file_path)
print("🎯 CSV 파일 로딩 완료")

# 3️⃣ 데이터 변환
museums = convert_df_to_museums(df)

# 3-1️⃣ 누락된 address 또는 region 제거
museums = [m for m in museums if m["address"] and m["region"]]

print(f"✅ 변환된 데이터 수: {len(museums)}")
print("📌 첫 3개 미리보기:")
for m in museums[:3]:
    print(m)

# 4️⃣ DB 저장
print("📥 DB 저장 시작...")
insert_museums(museums)
print("✅ DB 저장 완료")
