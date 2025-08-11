from typing import Optional, List, Dict, Tuple
import yaml
import re

def load_rules(yml_path: str) -> List[Dict]:
    """era_rules.yml 로드"""
    with open(yml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data["rules"]

# -------------------------------
# 유틸: 텍스트 정규화
# -------------------------------
def normalize(text: str) -> str:
    # 공백/파편 정리
    t = text.strip()
    # 물결統一
    t = t.replace("∼", "~").replace("～", "~")
    # 괄호 안 공백 줄이기
    t = re.sub(r"\s+", " ", t)
    return t

# -------------------------------
# 전처리 (너무 세게 버리지 않기)
# -------------------------------
def preprocess_detail(detail: str) -> str:
    """원본 detail 텍스트를 정리 (키워드 매칭용)"""
    if not detail:
        return ""
    text = normalize(detail)

    # 무의미 값 제거
    trash_exact = {"null","NULL","기타",".","-","~"}
    if text in trash_exact:
        return ""
    if re.fullmatch(r"\d{1,2}(?:책|년)?", text):
        return ""

    # 흔한 교정 + 변형 처리
    repl = {
        "나말여초": "여말선초",
        "려말선초": "여말선초",
        "나말려초": "여말선초",
        "조신시대": "조선시대",
        "정유재란": "조선시대",
        "임진왜란": "조선시대",
        "마한": "삼한시대",
    }

    # 단순 치환
    for k, v in repl.items():
        if k in text:
            text = text.replace(k, v)

    # '여말 선초', '여-말 선초', '여말·선초' 같은 변형도 통일
    text = re.sub(r"여\s*말\s*선초", "여말선초", text)
    text = re.sub(r"여말[·\-\~]선초", "여말선초", text)

    return text

# -------------------------------
# 세기 → 연도 범위 변환 (세부 구간 지원)
# -------------------------------
_SEG_MAP: Dict[str, Tuple[int,int]] = {
    # (시작백분율, 끝백분율) : 01~33, 34~66, 67~00
    "초": (1, 33), "초기": (1, 33), "전반": (1, 33),
    "중": (34, 66), "중기": (34, 66), "중반": (34, 66),
    "후": (67, 100), "후기": (67, 100), "후반": (67, 100),
    "말": (90, 100), "말기": (90, 100),  # 말은 좁게
}

def _century_segment_years(c: int, seg: Optional[str]) -> Tuple[int,int]:
    start = c*100 - 99  # 17세기 -> 1601
    end = c*100         # 1700
    if not seg:
        return start, end
    seg = seg.strip()
    if seg in _SEG_MAP:
        a, b = _SEG_MAP[seg]
        # 백분율을 연도로 환산
        s = start + int((a-1) * 1.00 * 100 / 100)
        e = start + int(b * 1.00 * 100 / 100) - 1
        # 경계 보정
        s = max(s, start)
        e = min(e, end)
        if s > e: s, e = start, end
        return s, e
    # 미지정 구간
    return start, end

def century_to_years(text: str) -> Optional[Tuple[int,int]]:
    """
    '17세기', '17세기 전반', '17~18세기', '18세기말', '19C 후반', '14세기 후반~15세기 초' 등
    → (min_year, max_year)
    """
    t = normalize(text)

    # 모든 세기 토큰 추출
    # ex) "14세기 후반", "15세기 초", "19C 중반"
    token_re = re.compile(
        r"(?P<c>\d{1,2})\s*(?:세기|[cC])\s*(?P<seg>전반|중반|후반|초기|중기|후기|초|중|후|말|말기)?"
    )

    # 범위 구분자 기준으로 좌우 파편 분해 (예: "14세기 후반~15세기 초")
    parts = re.split(r"~|〜|–|-|―|—", t)
    spans: List[Tuple[int,int]] = []

    for part in parts:
        m = token_re.search(part)
        if not m:
            continue
        c = int(m.group("c"))
        seg = m.group("seg")
        s, e = _century_segment_years(c, seg)
        spans.append((s, e))

    if spans:
        return min(s for s,_ in spans), max(e for _,e in spans)

    return None

# -------------------------------
# 숫자 연도 추출
# -------------------------------
def explicit_years_range(text: str) -> Optional[Tuple[int,int]]:
    t = normalize(text)
    # 3~4자리 연도만 (33년 같은 건 무시)
    years = [int(y) for y in re.findall(r"(?<!\d)(\d{3,4})(?!\d)\s*년?", t)]
    if years:
        return min(years), max(years)
    return None

# -------------------------------
# 시대 구간 정의 + 최다 겹침 선택
# -------------------------------
ERA_WINDOWS = [
    ("삼국시대", 57, 668),
    ("통일신라", 668, 935),
    ("고려시대", 918, 1392),
    ("조선시대", 1392, 1897),
    ("대한제국시대", 1897, 1910),
    ("일제강점기", 1910, 1945),
    ("현대/대한민국", 1945, 9999),
]

def pick_era_by_overlap(min_y: int, max_y: int) -> Optional[str]:
    best_label, best_len = None, -1
    for label, a, b in ERA_WINDOWS:
        overlap = max(0, min(max_y, b) - max(min_y, a) + 1)
        if overlap > best_len:
            best_len = overlap
            best_label = label
    return best_label if best_len > 0 else None

# -------------------------------
# 연/세기 기반 매핑 (raw 우선)
# -------------------------------
def year_to_era(text: str) -> Optional[str]:
    t = normalize(text)

    # BC/기원전
    if "BC" in t.upper() or "기원전" in t:
        return "선사시대"

    # 세기 우선
    cy = century_to_years(t)
    if cy:
        return pick_era_by_overlap(*cy)

    # 명시 연도
    yr = explicit_years_range(t)
    if yr:
        return pick_era_by_overlap(*yr)

    return None

# -------------------------------
# 최종 추출
# -------------------------------
def extract_era(detail: Optional[str], rules: List[Dict]) -> Optional[str]:
    if not detail:
        return None

    raw = str(detail)

    # 1) 원문으로 연/세기 판별
    era = year_to_era(raw)
    if era:
        return era

    # 1.5) ***원문에 룰 먼저 적용***  ← 추가
    for rule in rules:
        for kw in rule["keywords"]:
            if re.search(kw, raw):
                return rule["label"]

    # 2) 전처리 후 다시 연/세기 판별
    text = preprocess_detail(raw)
    if text:
        era = year_to_era(text)
        if era:
            return era

        # 3) 전처리 텍스트에 룰 적용 (보조)
        for rule in rules:
            for kw in rule["keywords"]:
                if re.search(kw, text):
                    return rule["label"]

    return None