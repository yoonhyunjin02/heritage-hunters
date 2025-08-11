import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional, Tuple
from pyproj import Transformer

BASE_URL = "https://gis-heritage.go.kr/openapi/xmlService/spca.do"
TF = Transformer.from_crs("EPSG:5179", "EPSG:4326", always_xy=True)

# 시도명 → 코드 매핑
SI_NAME_TO_CODE = {
    "서울": 11, "서울특별시": 11,
    "부산": 21, "부산광역시": 21,
    "대구": 22, "대구광역시": 22,
    "인천": 23, "인천광역시": 23,
    "광주": 24, "광주광역시": 24,
    "대전": 25, "대전광역시": 25,
    "울산": 26, "울산광역시": 26,
    "세종": 45, "세종특별자치시": 45,
    "경기": 31, "경기도": 31,
    "강원": 32, "강원도": 32, "강원특별자치도": 32,
    "충북": 33, "충청북도": 33,
    "충남": 34, "충청남도": 34,
    "전북": 35, "전라북도": 35, "전북특별자치도": 35,
    "전남": 36, "전라남도": 36,
    "경북": 37, "경상북도": 37,
    "경남": 38, "경상남도": 38,
    "제주": 50, "제주특별자치도": 50,
}

def _to_wgs84(x: str, y: str) -> Tuple[Optional[float], Optional[float]]:
    if not x or not y:
        return None, None
    try:
        lon, lat = TF.transform(float(x), float(y))
        return round(lat, 8), round(lon, 8)
    except Exception:
        return None, None

def _sido_info(vloc_name: str) -> Tuple[Optional[str], Optional[int]]:
    if not vloc_name:
        return None, None
    sido = vloc_name.split()[0]
    return sido, SI_NAME_TO_CODE.get(sido)

def fetch_spca_by_code(kdcd: str) -> List[Dict]:
    """종목코드로 전체 문화재 목록 가져오기"""
    r = requests.get(BASE_URL, params={"ccbaKdcd": kdcd}, timeout=20)
    r.raise_for_status()
    r.encoding = "utf-8"
    root = ET.fromstring(r.text)

    results = []
    for spca in root.findall(".//spca"):
        vloc_name = spca.findtext("vlocName")
        sido_name, sido_code = _sido_info(vloc_name)

        lat, lon = _to_wgs84(spca.findtext("cnX"), spca.findtext("cnY"))

        results.append({
            "name": spca.findtext("ccbaMnm"),
            "ccma_name": spca.findtext("ccmaName"),
            "vloc_name": vloc_name,
            "crltsno_nm": spca.findtext("crltsnoNm"),
            "era": spca.findtext("ccceName"),
            "designated_at": spca.findtext("ccbaAsdt"),
            "category": spca.findtext("ctgrname"),
            "manager": spca.findtext("ccbaAdmin"),
            "lat": lat,
            "lon": lon,
            "vloc_sido_name": sido_name,
            "vloc_sido_code": sido_code,
            "ccba_kdcd": int(kdcd)
        })
    return results
