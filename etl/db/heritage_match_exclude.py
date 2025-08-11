# heritage_match_exclude.py
# 자동 매칭에서 제외해야 할 (name, designation, region) 조합 관리

from typing import Iterable, Tuple, Dict, Any, List

# -------------------------------
# 1) 원본 블랙리스트(51개)
#    name: str, designation: int (종목코드), region: int(시도코드)
# -------------------------------
_EXCLUDE_KEYS_RAW: List[Tuple[str, int, int]] = [
    ("불설대보모은중경", 21, 33),
    ("현수제승법수", 21, 31),
    ("모법연화경 권제1", 21, 38),
    ("대장장", 22, 34),
    ("삼층석탑", 21, 21),
    ("목조건미타여래좌상", 21, 21),
    ("용궁사 느티나무", 55, 23),
    ("울릉 나리동 투막집", 24, 37),
    ("현수제승법수", 21, 21),
    ("조상경", 21, 31),
    ("용산함상육도보설", 21, 33),
    ("동묘", 21, 21),
    ("금오산성", 23, 37),
    ("현수제승법수", 21, 11),
    ("모법연화경 권6~7", 21, 33),
    ("수륙추재평재의촬요", 21, 11),
    ("한토술담그기", 21, 35),
    ("고황항선요", 21, 11),
    ("향악", 21, 38),
    ("백산서원", 31, 35),
    ("불설삼십일장경", 21, 33),
    ("수천송죽", 21, 11),
    ("칠곡 진주댁", 31, 37),
    ("예수시왕생칠제의촬요", 21, 11),
    ("문원공 화재 이연적 신도비", 21, 37),
    ("임인진연도 병풍", 21, 11),
    ("청동 종", 21, 11),
    ("백자호", 21, 11),
    ("지장보살본원경", 21, 11),
    ("서울 이화여자대학교 토마스홀", 79, 11),
    ("법집별행록절요병입사기", 21, 11),
    ("청동북", 21, 21),
    ("유금강산권", 21, 37),
    ("모법연화경", 21, 33),
    ("미륵암석불입상", 31, 35),
    ("옹기장", 22, 34),
    ("법화영험전", 21, 11),
    ("모법연화경 권1", 21, 33),
    ("선원제진전도서", 31, 26),
    ("조문한가옥", 24, 50),
    ("영동 영국사 구형승탑", 21, 33),
    ("하동 법성선원 법집별행록절요병입사기", 21, 38),
    ("고령대가야큰성지", 31, 37),
    ("모법연화경", 21, 11),
    ("모법연화경 권1~3", 21, 33),
    ("봉화유기장", 22, 37),
    ("모법연화경 권4~7", 21, 33),
    ("목조건미타좌상", 21, 21),
    ("돌하르방", 24, 50),
    ("불설대보모은중경", 21, 11),
    ("김옥균선생유허", 23, 34),
]

# -------------------------------
# 2) 정규화 & 조회용 Set
#    - 공백 트림
#    - 한글명 소문자 변환 X (고유명사 보존)
#    - designation/region 은 int로 캐스팅
# -------------------------------
def _to_int_or_none(v: Any) -> int:
    if v is None or v == "":
        return None  # type: ignore
    try:
        return int(v)
    except (TypeError, ValueError):
        # '24' 같은 문자열, '024' 도 안전 변환
        return int(str(v).strip())

def normalize_key(name: Any, designation: Any, region: Any) -> Tuple[str, int, int]:
    n = "" if name is None else str(name).strip()
    d = _to_int_or_none(designation)
    r = _to_int_or_none(region)
    return (n, d, r)  # type: ignore

EXCLUDE_SET = {
    normalize_key(n, d, r) for (n, d, r) in _EXCLUDE_KEYS_RAW
}

# -------------------------------
# 3) 공개 API
# -------------------------------
def is_excluded(name: Any, designation: Any, region: Any) -> bool:
    """(name, designation, region) 조합이 블랙리스트에 있으면 True"""
    return normalize_key(name, designation, region) in EXCLUDE_SET

def filter_out(
    records: Iterable[Dict[str, Any]],
    name_field: str = "name",
    designation_field: str = "designation",
    region_field: str = "region",
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    레코드 리스트에서 블랙리스트 매칭 제외.
    반환: (kept, excluded)
    """
    
    kept: List[Dict[str, Any]] = []
    excluded: List[Dict[str, Any]] = []
    for rec in records:
        key = normalize_key(rec.get(name_field), rec.get(designation_field), rec.get(region_field))
        (excluded if key in EXCLUDE_SET else kept).append(rec)
    return kept, excluded

# -------------------------------
# 4) 모듈 단독 실행 테스트
# -------------------------------
if __name__ == "__main__":
    # 간단 테스트
    sample = {"name": "돌하르방", "designation": "24", "region": "50"}
    print("is_excluded:", is_excluded(sample["name"], sample["designation"], sample["region"]))
