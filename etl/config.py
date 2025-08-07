import yaml
import os

def load_db_config():
    yaml_path = os.path.join(
        os.path.dirname(__file__),
        "../src/main/resources/secrets/application-secret.yml"
    )

    with open(yaml_path, "r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    try:
        db_url = config["spring"]["datasource"]["url"]
        username = config["spring"]["datasource"]["username"]
        password = config["spring"]["datasource"]["password"]
    except KeyError as e:
        raise KeyError(f"YAML 설정 파일에서 필요한 키를 찾을 수 없습니다: {e}")

    if db_url.startswith("jdbc:postgresql://"):
        db_url = db_url.replace("jdbc:postgresql://", "")
    else:
        raise ValueError("DB URL 형식이 잘못되었습니다. 'jdbc:postgresql://'로 시작해야 합니다.")

    try:
        host_port, dbname = db_url.split("/")
        host, port = host_port.split(":")
    except ValueError:
        raise ValueError("DB URL 파싱 실패. 형식: jdbc:postgresql://host:port/dbname")

    return {
        "host": host,
        "port": int(port),
        "user": username,
        "password": password,
        "dbname": dbname
    }

def load_museum_api_key():
    yaml_path = os.path.join(
        os.path.dirname(__file__),
        "../src/main/resources/secrets/application-secret.yml"
    )

    with open(yaml_path, "r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    try:
        return config["public"]["data"]["museum"]["api-key"]
    except KeyError as e:
        raise KeyError(f"[❌ 공공데이터 인증키 누락] {e}")


DB_CONFIG = load_db_config()