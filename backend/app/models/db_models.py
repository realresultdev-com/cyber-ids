import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="analyst")
    created_at = Column(DateTime, default=datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    dataset_type = Column(String(50), default="CUSTOM")  # CICIDS2017, CSE-CIC-IDS2018, UNSW-NB15, CUSTOM
    target_column = Column(String(100), default="Label")
    columns_meta = Column(Text, default="[]")  # JSON list of columns & types
    missing_count = Column(Integer, default=0)
    duplicate_count = Column(Integer, default=0)
    class_distribution = Column(Text, default="{}")  # JSON {class_name: count}
    status = Column(String(30), default="READY")  # READY, PROCESSING, ERROR
    created_at = Column(DateTime, default=datetime.utcnow)

    preprocessings = relationship("PreprocessingPipeline", back_populates="dataset", cascade="all, delete-orphan")

class PreprocessingPipeline(Base):
    __tablename__ = "preprocessing_pipelines"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    name = Column(String(100), nullable=False)
    config = Column(Text, default="{}")  # JSON with missing_value_strategy, scaling_method, imbalance_method, etc.
    feature_names = Column(Text, default="[]")  # JSON list of chosen features
    target_column = Column(String(100), nullable=False)
    problem_type = Column(String(20), default="binary")  # binary or multiclass
    label_mapping = Column(Text, default="{}")  # JSON label -> int
    train_rows = Column(Integer, default=0)
    test_rows = Column(Integer, default=0)
    original_train_dist = Column(Text, default="{}")  # JSON
    resampled_train_dist = Column(Text, default="{}")  # JSON
    test_dist = Column(Text, default="{}")  # JSON
    pipeline_path = Column(String(500), nullable=False)  # Saved joblib path for scaler & encoders
    train_data_path = Column(String(500), nullable=True)  # Processed train npz
    test_data_path = Column(String(500), nullable=True)   # Processed test npz
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="preprocessings")
    models = relationship("TrainedModel", back_populates="preprocessing", cascade="all, delete-orphan")

class TrainedModel(Base):
    __tablename__ = "trained_models"

    id = Column(Integer, primary_key=True, index=True)
    preprocessing_id = Column(Integer, ForeignKey("preprocessing_pipelines.id"), nullable=False)
    name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)  # RANDOM_FOREST, XGBOOST, DECISION_TREE, SVM, ANN, LSTM
    problem_type = Column(String(20), default="binary")
    hyperparameters = Column(Text, default="{}")  # JSON dict
    training_history = Column(Text, default="[]")  # JSON epochs/loss for DL
    model_path = Column(String(500), nullable=False)  # joblib or pt file
    training_time_seconds = Column(Float, default=0.0)
    train_accuracy = Column(Float, default=0.0)
    val_accuracy = Column(Float, default=0.0)
    status = Column(String(30), default="TRAINED")  # TRAINING, TRAINED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    preprocessing = relationship("PreprocessingPipeline", back_populates="models")
    evaluation = relationship("ModelEvaluation", back_populates="model", uselist=False, cascade="all, delete-orphan")

class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("trained_models.id"), nullable=False)
    accuracy = Column(Float, default=0.0)
    precision_macro = Column(Float, default=0.0)
    recall_macro = Column(Float, default=0.0)
    f1_macro = Column(Float, default=0.0)
    precision_weighted = Column(Float, default=0.0)
    recall_weighted = Column(Float, default=0.0)
    f1_weighted = Column(Float, default=0.0)
    false_positive_rate = Column(Float, default=0.0)
    false_negative_rate = Column(Float, default=0.0)
    roc_auc = Column(Float, default=0.0)
    inference_time_ms = Column(Float, default=0.0)
    confusion_matrix = Column(Text, default="[]")  # JSON 2D array
    classes = Column(Text, default="[]")  # JSON list of class names
    per_class_metrics = Column(Text, default="{}")  # JSON {class_name: {precision, recall, f1, support}}
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("TrainedModel", back_populates="evaluation")

class DetectionJob(Base):
    __tablename__ = "detection_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String(100), nullable=False)
    model_id = Column(Integer, ForeignKey("trained_models.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    result_csv_path = Column(String(500), nullable=True)
    total_flows = Column(Integer, default=0)
    normal_count = Column(Integer, default=0)
    malicious_count = Column(Integer, default=0)
    attack_distribution = Column(Text, default="{}")  # JSON
    status = Column(String(30), default="COMPLETED")
    duration_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("TrainedModel")
    records = relationship("DetectionRecord", back_populates="job", cascade="all, delete-orphan")

class DetectionRecord(Base):
    __tablename__ = "detection_records"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("detection_jobs.id"), nullable=False)
    flow_id = Column(String(100), nullable=True)
    src_ip = Column(String(50), default="N/A")
    dst_ip = Column(String(50), default="N/A")
    src_port = Column(Integer, default=0)
    dst_port = Column(Integer, default=0)
    protocol = Column(String(20), default="TCP")
    predicted_label = Column(String(50), nullable=False)
    confidence = Column(Float, default=0.0)
    is_malicious = Column(Boolean, default=False)
    timestamp = Column(String(50), nullable=True)

    job = relationship("DetectionJob", back_populates="records")

class MonitoringSession(Base):
    __tablename__ = "monitoring_sessions"

    id = Column(Integer, primary_key=True, index=True)
    interface_name = Column(String(100), nullable=False)
    model_id = Column(Integer, ForeignKey("trained_models.id"), nullable=True)
    status = Column(String(20), default="RUNNING")  # RUNNING, STOPPED, DEMO
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    packets_captured = Column(Integer, default=0)
    flows_analyzed = Column(Integer, default=0)
    alerts_generated = Column(Integer, default=0)

    alerts = relationship("SecurityAlert", back_populates="session", cascade="all, delete-orphan")

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("monitoring_sessions.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    src_ip = Column(String(50), default="127.0.0.1")
    dst_ip = Column(String(50), default="127.0.0.1")
    src_port = Column(Integer, default=0)
    dst_port = Column(Integer, default=0)
    protocol = Column(String(20), default="TCP")
    attack_category = Column(String(50), nullable=False)
    severity = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.95)
    model_name = Column(String(100), default="Model")
    flow_summary = Column(Text, default="{}")
    status = Column(String(30), default="NEW")  # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE

    session = relationship("MonitoringSession", back_populates="alerts")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    report_type = Column(String(50), nullable=False)  # MODEL_COMPARISON, DETECTION_AUDIT, SECURITY_SUMMARY
    model_id = Column(Integer, nullable=True)
    dataset_id = Column(Integer, nullable=True)
    file_path = Column(String(500), nullable=False)
    format = Column(String(10), default="PDF")  # PDF or CSV
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

