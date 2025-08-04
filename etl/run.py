from adapters.heritage_api_adapter import get_heritages_by_kind_code
from db import insert_heritages
import time


def main():
    print("🔍 문화유산 데이터 수집 시작")

    kind_codes = [
        "11", "12", "13", "14", "16", "17", "18",
        "21", "22", "23", "24", "25", "31", "55", "66",
        "79", "80"
    ]

    for kdcd in kind_codes:
        print(f"\n▶ 종목코드 {kdcd} 수집 시작")
        heritages = get_heritages_by_kind_code(kdcd)
        print(f"✔ 종목코드 {kdcd} 수집 완료 ({len(heritages)}건)")

        if heritages:
            print("💾 저장 중...")
            insert_heritages(heritages)
            time.sleep(0.5)

    print("\n🎉 전체 수집 및 저장 완료")


if __name__ == "__main__":
    main()