import requests
import time
import math
from config import load_museum_api_key

API_KEY = load_museum_api_key()
print("API KEY:", API_KEY)
BASE_URL = "https://api.data.go.kr/openapi/tn_pubr_public_museum_artgr_info_api"

print("✅ 최종 요청 URL:", f"{BASE_URL}?serviceKey={API_KEY}&pageNo=1&numOfRows=1&type=json")

def fetch_museum_data_json(page=1, rows=100):
    url = (
        f"{BASE_URL}?serviceKey={API_KEY}&pageNo={page}&numOfRows={rows}&type=json"
    )

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        return data.get("response", {}).get("body", {}).get("items", [])
    except Exception as e:
        print(f"[❌ API 요청 실패] page={page} | {e}")
        return []


def fetch_total_count():
    url = (
        f"{BASE_URL}"
        f"?serviceKey={API_KEY}&pageNo=1&numOfRows=1&type=json"
    )

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        return int(data.get("response", {}).get("body", {}).get("totalCount", 0))
    except Exception as e:
        print(f"[❌ totalCount 조회 실패] {e}")
        return 0



def parse_region(address):
    if not address:
        return None
    return address.split()[0]


def parse_museum_item(item):
    try:
        return {
            "name": (item.get("fcltyNm") or "").strip(),
            "category": (item.get("fcltyType") or "").strip(),
            "latitude": float(item["latitude"]) if item.get("latitude") else None,
            "longitude": float(item["longitude"]) if item.get("longitude") else None,
            "address": (item.get("rdnmadr") or "").strip(),
            "region": parse_region(item.get("rdnmadr")),
            "description": (item.get("fcltyIntrcn") or "").strip()
        }
    except Exception as e:
        print(f"[⚠️ 데이터 파싱 오류] {item.get('fcltyNm')} | {e}")
        return None


def get_all_museums(delay=0.2):
    print("📊 전체 데이터 개수 조회 중...")
    total_count = fetch_total_count()
    if total_count == 0:
        print("🚫 수집할 데이터가 없습니다.")
        return []

    page_size = 100
    max_page = math.ceil(total_count / page_size)

    all_museums = []
    seen_names = set()

    for page in range(1, max_page + 1):
        print(f"📄 페이지 {page} 수집 중...")
        items = fetch_museum_data_json(page, rows=page_size)
        if not items:
            print("📦 페이지 {page} 응답 없음")
            break

        for item in items:
            name = item.get("fcltyNm")
            if name in seen_names:
                continue
            seen_names.add(name)

            museum = parse_museum_item(item)
            if museum:
                all_museums.append(museum)

        time.sleep(delay)

    print(f"\n✅ 총 수집 완료: {len(all_museums)}건")
    return all_museums