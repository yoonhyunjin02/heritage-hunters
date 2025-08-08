from adapters.spca_adapter import fetch_spca_by_code
from db.spca_db import insert_spca

KIND_CODES = ["11", "12", "13", "15", "16", "17", "18", "79"]

def main():
    for code in KIND_CODES:
        print(f"\n▶ 종목코드 {code} 수집 중...")
        data = fetch_spca_by_code(code)
        print(f" - {len(data)}건 수집됨")
        insert_spca(data)
    print("\n🎉 전체 작업 완료")

if __name__ == "__main__":
    main()
