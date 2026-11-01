from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class BaseSchema(BaseModel):
    model_config = {"protected_namespaces": (), "from_attributes": True}

# User Schemas
class UserBase(BaseSchema):
    username: str
    email: str
    role: Optional[str] = "analyst"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseSchema):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

class TokenResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Dataset Schemas
class DatasetCreate(BaseSchema):
    name: str
    dataset_type: str = "CUSTOM"
    target_column: Optional[str] = "Label"

class DatasetPreviewResponse(BaseSchema):
    id: int
    name: str
    original_filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    dataset_type: str
    target_column: str
    columns_meta: List[Dict[str, Any]]
    missing_count: int
    duplicate_count: int
    class_distribution: Dict[str, int]
    sample_rows: List[Dict[str, Any]]
    created_at: datetime

# Preprocessing Schemas
class PreprocessingCreate(BaseSchema):
    dataset_id: int
    name: str
    target_column: str = "Label"
    problem_type: str = "binary"  # binary or multiclass
    feature_selection: Optional[List[str]] = None
    missing_strategy: str = "median"  # drop, median, mean, mode
    scaling_method: str = "standard"  # standard, minmax, robust
    imbalance_method: str = "SMOTE"   # NONE, SMOTE, RANDOM_UNDERSAMPLE, CLASS_WEIGHT
    test_size: float = 0.2
    random_state: int = 42

class PreprocessingResponse(BaseSchema):
    id: int
    dataset_id: int
    name: str
    problem_type: str
    target_column: str
    feature_names: List[str]
    train_rows: int
    test_rows: int
    original_train_dist: Dict[str, int]
    resampled_train_dist: Dict[str, int]
    test_dist: Dict[str, int]
    created_at: datetime

# Model Training Schemas
class ModelTrainRequest(BaseSchema):
    preprocessing_id: int
    name: str
    model_type: str  # RANDOM_FOREST, XGBOOST, DECISION_TREE, SVM, ANN, LSTM
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelResponse(BaseSchema):
    id: int
    preprocessing_id: int
    name: str
    model_type: str
    problem_type: str
    hyperparameters: Dict[str, Any]
    training_time_seconds: float
    train_accuracy: float
    val_accuracy: float
    status: str
    error_message: Optional[str]
    created_at: datetime

# Evaluation Schemas
class EvaluationResponse(BaseSchema):
    id: int
    model_id: int
    accuracy: float
    precision_macro: float
    recall_macro: float
    f1_macro: float
    precision_weighted: float
    recall_weighted: float
    f1_weighted: float
    false_positive_rate: float
    false_negative_rate: float
    roc_auc: float
    inference_time_ms: float
    confusion_matrix: List[List[int]]
    classes: List[str]
    per_class_metrics: Dict[str, Dict[str, float]]
    created_at: datetime

# Detection Schemas
class DetectionRunRequest(BaseSchema):
    model_id: int
    job_name: str

class DetectionJobResponse(BaseSchema):
    id: int
    job_name: str
    model_id: int
    filename: str
    total_flows: int
    normal_count: int
    malicious_count: int
    attack_distribution: Dict[str, int]
    status: str
    duration_seconds: float
    created_at: datetime

# Monitoring Schemas
class MonitoringStartRequest(BaseSchema):
    interface_name: str = "demo"
    model_id: Optional[int] = None
    demo_mode: bool = True

class MonitoringSessionResponse(BaseSchema):
    id: int
    interface_name: str
    model_id: Optional[int]
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    packets_captured: int
    flows_analyzed: int
    alerts_generated: int

# Alert Schemas
class AlertResponse(BaseSchema):
    id: int
    session_id: Optional[int]
    timestamp: datetime
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    attack_category: str
    severity: str
    confidence: float
    model_name: str
    status: str
    flow_summary: Optional[str]

class AlertStatusUpdate(BaseSchema):
    status: str  # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE

# Dashboard Stats Schema
class DashboardStatsResponse(BaseSchema):
    total_flows_analyzed: int
    normal_traffic_count: int
    malicious_traffic_count: int
    total_detected_attacks: int
    detection_accuracy: float
    precision_macro: float
    recall_macro: float
    f1_macro: float
    recent_alerts: List[AlertResponse]
    traffic_distribution: Dict[str, int]
    attack_category_distribution: Dict[str, int]
    timeline_activity: List[Dict[str, Any]]
