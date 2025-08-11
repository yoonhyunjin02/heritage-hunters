# loader/museum_csv_loader.py
import pandas as pd

def load_museum_csv(file_path):
    return pd.read_csv(file_path, encoding="cp949")

def parse_region(address):
    if pd.isna(address) or not isinstance(address, str):
        return None
    return address.split()[0]

def convert_df_to_museums(df):
    museums = []

    for _, row in df.iterrows():
        try:
            museum = {
                "name": row["시설명"],
                "category": row["박물관미술관구분"],
                "latitude": float(row["위도"]) if pd.notna(row["위도"]) else None,
                "longitude": float(row["경도"]) if pd.notna(row["경도"]) else None,
                "address": row["소재지도로명주소"],
                "region": parse_region(row["소재지도로명주소"]),
                "description": row["박물관미술관소개"] if pd.notna(row["박물관미술관소개"]) else ""
            }
            museums.append(museum)
        except Exception as e:
            print(f"[⚠️ 변환 오류] {row.get('시설명')} | {e}")

    return museums
