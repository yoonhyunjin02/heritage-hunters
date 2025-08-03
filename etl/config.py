import yaml
import os

def load_db_config():
    yaml_path = os.path.join(
        os.path.dirname(__file__),
        "../src/main/resources/secrets/application-secret.yml"
    )

    with open(yaml_path, "r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    db_url = config["DB_URL"]

    # "jdbc:postgresql://host:port/dbname" → 잘라내기
    # 1. 접두사 제거
    if db_url.startswith("jdbc:postgresql://"):
        db_url = db_url.replace("jdbc:postgresql://", "")
    else:
        raise ValueError("DB_URL 형식이 잘못되었습니다 (jdbc:postgresql://...)")

    # 2. host:port/dbname → 나누기
    host_port, dbname = db_url.split("/")
    host, port = host_port.split(":")

    return {
        "host": host,
        "port": int(port),
        "user": config["DB_USERNAME"],
        "password": config["DB_PASSWORD"],
        "dbname": dbname
    }

DB_CONFIG = load_db_config()