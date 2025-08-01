from adapters.museum_api_adapter import fetch_museum_data, transform_museum_data
from db import upsert_museums  # 이건 db.py에 별도로 정의되어 있어야 함

def main():
    print("📥 박물관 데이터 수집 중...")
    raw_data = fetch_museum_data()
    parsed_data = transform_museum_data(raw_data)

    print(f"🔄 변환 완료: {len(parsed_data)}건")
    
    if parsed_data:
        upsert_museums(parsed_data)
        print("✅ DB 저장 완료")
    else:
        print("⚠️ 저장할 데이터가 없습니다.")

if __name__ == "__main__":
    main()
