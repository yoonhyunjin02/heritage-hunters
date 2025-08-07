from adapters.museum_api import get_all_museums
from db.insert_museums import insert_museums


def main():
    print("🎨 박물관/미술관 데이터 수집 시작")
    
    museums = get_all_museums()
    print(f"✔ 수집 완료 ({len(museums)}건)")

    if museums:
        print("💾 저장 중...")
        insert_museums(museums)

    print("🏁 완료")


if __name__ == "__main__":
    main()