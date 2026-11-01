import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "datasets"
MODELS_DIR = DATA_DIR / "trained_models"
REPORTS_DIR = DATA_DIR / "reports"
PCAP_DIR = DATA_DIR / "pcap_samples"

for d in [DATA_DIR, UPLOAD_DIR, MODELS_DIR, REPORTS_DIR, PCAP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "Network Intrusion Detection System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-college-ids-project-key-2026-safe")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'ids_database.sqlite'}")

    DATA_DIR: Path = DATA_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    MODELS_DIR: Path = MODELS_DIR
    REPORTS_DIR: Path = REPORTS_DIR
    PCAP_DIR: Path = PCAP_DIR

settings = Settings()

