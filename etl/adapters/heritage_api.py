import requests
import xml.etree.ElementTree as ET
import time

BASE_LIST_URL = "http://www.khs.go.kr/cha/SearchKindOpenapiList.do"
BASE_DETAIL_URL = "http://www.khs.go.kr/cha/SearchKindOpenapiDt.do"

CITY_CODES = [
    "11", "21", "22", "23", "24", "25", "26", "45",
    "31", "32", "33", "34", "35", "36", "37", "38",
    "50"
]

def fetch_heritage_list_xml(ccbaKdcd, ccbaCtcd, page_index=1, page_unit=100):
    params = {
        "ccbaKdcd": ccbaKdcd,
        "ccbaCtcd": ccbaCtcd,
        "ccbaCncl": "N",
        "pageIndex": page_index,
        "pageUnit": page_unit
    }
    response = requests.get(BASE_LIST_URL, params=params, timeout=5)
    response.encoding = "utf-8"
    if response.status_code != 200:
        raise Exception(f"[목록 요청 실패] {response.status_code} | {params}")
    return response.text

def parse_heritage_items(xml_data):
    root = ET.fromstring(xml_data)
    heritages = []
    for item in root.findall(".//item"):
        heritages.append({
            "id": item.findtext("ccbaAsno"),
            "name": item.findtext("ccbaMnm1"),
            "name_hanja": item.findtext("ccbaMnm2"),
            "thumbnail_url": None,
            "description": None,
            "designation": item.findtext("ccbaKdcd"),
            "region": item.findtext("ccbaCtcd"),
            "address": None,
            "era": None,
            "latitude": item.findtext("latitude"),
            "longitude": item.findtext("longitude"),
            "_kdcd": item.findtext("ccbaKdcd"),
            "_ctcd": item.findtext("ccbaCtcd")
        })
    return heritages

def fetch_heritage_detail_xml(ccbaKdcd, ccbaAsno, ccbaCtcd):
    params = {
        "ccbaKdcd": ccbaKdcd,
        "ccbaAsno": ccbaAsno,
        "ccbaCtcd": ccbaCtcd
    }
    response = requests.get(BASE_DETAIL_URL, params=params, timeout=5)
    response.encoding = "utf-8"
    if response.status_code != 200:
        raise Exception(f"[상세 요청 실패] {response.status_code} | {params}")
    return response.text

def parse_heritage_detail(xml_data):
    root = ET.fromstring(xml_data)
    item = root.find(".//item")
    if item is None:
        return {}
    return {
        "description": item.findtext("content"),
        "era": item.findtext("ccceName"),
        "thumbnail_url": item.findtext("imageUrl"),
        "address": item.findtext("ccbaLcad")
    }

def enrich_heritage_detail(heritage):
    try:
        xml = fetch_heritage_detail_xml(
            heritage["_kdcd"], heritage["id"], heritage["_ctcd"]
        )
        detail = parse_heritage_detail(xml)
        heritage.update({
            "description": detail.get("description"),
            "era": detail.get("era"),
            "thumbnail_url": detail.get("thumbnail_url"),
            "address": detail.get("address")
        })
    except Exception as e:
        print(f"[상세조회 실패] {heritage.get('designation')}-{heritage.get('region')}-{heritage.get('id')} | {heritage.get('name')} | {e}")
    return heritage

def get_heritages_by_kind_code(kdcd, max_page=30, delay=0.2):
    all_data = []
    for ctcd in CITY_CODES:
        for page in range(1, max_page + 1):
            try:
                xml_data = fetch_heritage_list_xml(kdcd, ctcd, page_index=page)
                parsed = parse_heritage_items(xml_data)
                if not parsed:
                    break
                for heritage in parsed:
                    enrich_heritage_detail(heritage)
                    heritage.pop("_kdcd", None)
                    heritage.pop("_ctcd", None)
                    all_data.append(heritage)
                time.sleep(delay)
            except Exception as e:
                print(f"[목록 실패] {ctcd}-{kdcd} / page {page} | {e}")
                break
    return all_data