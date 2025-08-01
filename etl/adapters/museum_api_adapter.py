import requests

API_URL = "https://api.data.go.kr/openapi/tn_pubr_public_museum_artgr_info_api"
# API_KEY = "55riL2+bwuBd+mmQIrPh5d8mp2V8v5NEjNZRmWOUqeBnDstNLX1a7PIS3kw3dFpMxw0W8gqYYs1k0p2RsZdmOA=="  # Decoding 버전
API_KEY = "55riL2%2BbwuBd%2BmmQIrPh5d8mp2V8v5NEjNZRmWOUqeBnDstNLX1a7PIS3kw3dFpMxw0W8gqYYs1k0p2RsZdmOA%3D%3D"  # Encoding 버전

def fetch_museum_data(page: int = 1, num_of_rows: int = 100):
    """API에서 원본 데이터 수집"""
    params = {
        "serviceKey": API_KEY,
        "pageNo": page,
        "numOfRows": num_of_rows,
        "type": "JSON"
    }
    response = requests.get(API_URL, params=params)
    response.raise_for_status()
    return response.json()["response"]["body"]["items"]

def transform_museum_data(raw_items: list[dict]) -> list[dict]:
    """DB에 저장할 수 있도록 필드 매핑"""
    results = []
    for item in raw_items:
        results.append({
            "name": item.get("fcltyNm"),
            "category": item.get("fcltyType"),
            "latitude": float(item.get("latitude", 0) or 0),
            "longitude": float(item.get("longitude", 0) or 0),
            "address": item.get("rdnmadr") or item.get("lnmadr"),
            "region": item.get("institutionNm") or "",
            "description": item.get("fcltyIntrcn") or ""
        })
    return results
