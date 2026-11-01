# Intrusion Detection of Imbalanced Network Traffic Using Machine Learning and Deep Learning

An enterprise-grade, full-stack cybersecurity application and research platform designed for detecting, triaging, and analyzing imbalanced network traffic flows.

Built with **FastAPI**, **React.js**, **Tailwind CSS**, **Scikit-learn**, **XGBoost**, **PyTorch (ANN & LSTM)**, **Scapy**, and **ReportLab**.

---

## 1. Project Overview & Research Problem

In operational computer networks, malicious intrusions constitute less than 1–5% of overall network flow volume, while benign communication forms the vast majority (95–99%+). Standard machine learning algorithms optimize for naive accuracy, frequently learning a majority-class bias that yields 95%+ classification accuracy while failing to detect 0% of attacks (Recall = 0.00).

This project addresses this critical challenge by implementing and benchmarking:
1. **Baseline Machine Learning** (without imbalance handling)
2. **SMOTE** (Synthetic Minority Over-sampling Technique)
3. **Cost-Sensitive Class Weighting**
4. **Deep Learning Architectures**:
   - **Artificial Neural Network (ANN / Multi-Layer Perceptron)** with Batch Normalization and Dropout
   - **Long Short-Term Memory (LSTM)** with temporal sliding sequence windowing

### Zero Data Leakage Guarantee
- Resampling (SMOTE / Random Undersampling) is performed **strictly on the training partition** after stratified splitting.
- Imputers and feature scalers (StandardScaler / MinMaxScaler) are fitted exclusively on training sets.
- The test partition remains pure and un-resampled to mirror true real-world network flow distributions.

---

## 2. Full-Stack Architecture

- **Frontend**: React 19, Tailwind CSS v4, React Router v7, Recharts, Axios, Lucide Icons.
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy.
- **Machine Learning & Deep Learning**: Scikit-learn, XGBoost, PyTorch (CPU-optimized), Imbalanced-learn, Pandas, NumPy.
- **Network Flow Engine**: Scapy, 5-tuple bidirectional flow aggregation (CICFlowMeter feature schema).
- **Audit & Governance**: ReportLab (Vector PDF generator) and CSV data exports.
- **Database**: SQLite with WAL mode (zero-configuration local deployment; PostgreSQL compatible).

---

## 3. Directory Structure

```
network project/
├── backend/
│   ├── app/
│   │   ├── api/              # REST API Routers
│   │   │   ├── auth.py          # Session auth & JWT token issuance
│   │   │   ├── dashboard.py     # Real-time metrics & attack distributions
│   │   │   ├── datasets.py      # CSV dataset ingestion & preview
│   │   │   ├── preprocessing.py # SMOTE & class imbalance pipelines
│   │   │   ├── training.py      # Asynchronous ML & PyTorch training
│   │   │   ├── models.py        # Model registry & comparative evaluations
│   │   │   ├── detection.py     # Offline CSV intrusion detection
│   │   │   ├── monitoring.py    # Local packet capture & demo stream
│   │   │   ├── alerts.py        # SOC incident triage & status updates
│   │   │   ├── reports.py       # PDF/CSV audit reports
│   │   │   └── settings.py      # Engine sensitivity & timeouts
│   │   ├── core/             # Configuration, Database engine, Security
│   │   ├── models/           # SQLAlchemy DB models & Pydantic schemas
│   │   └── services/         # Business logic, ML, DL, and flow engines
│   ├── data/                 # Datasets, saved pipelines, trained models, reports
│   ├── requirements.txt      # Python dependencies
│   └── init_db.py            # Database seeder & benchmark trainer
├── frontend/
│   ├── src/
│   │   ├── components/       # Metric cards, Badges, Modals, Navigation
│   │   ├── context/          # Auth and Dark/Light theme contexts
│   │   ├── pages/            # 13 complete application pages
│   │   └── services/         # Axios API client
│   ├── package.json
│   └── vite.config.js
├── start.bat                 # One-click Windows launch script
├── stop.bat                  # One-click Windows graceful stop script
├── .env.example
└── README.md
```

---

## 4. Quick Start Guide for Windows (One-Click Handover)

This project is configured to run on any standard Windows laptop without requiring cloud dependencies, paid APIs, or external GPU hardware.

### Prerequisites
1. **Python 3.10 or 3.11** installed with "Add Python to PATH" enabled.
2. **Node.js (v18+)** installed.

### Launching the Application
Simply double-click:
```bat
start.bat
```
The startup agent will:
1. Detect Python and Node.js.
2. Automatically create the virtual environment (`backend\venv`) if missing.
3. Install required Python and Node.js packages if needed.
4. Run `init_db.py` to seed default accounts, benchmark datasets, and pre-trained models.
5. Launch the FastAPI backend on `http://127.0.0.1:8000`.
6. Launch the React dashboard on `http://localhost:5173`.
7. Automatically open your default web browser.

### Default Login Credentials
- **Administrator**: `admin` / `admin123`
- **Security Analyst**: `analyst` / `analyst123`
*(A quick one-click credential button is also provided on the login page for instant college presentation).*

### Stopping the Application
Double-click:
```bat
stop.bat
```

---

## 5. Manual Installation Guide

If you prefer running commands manually in PowerShell:

### 1. Backend Setup
```powershell
cd "c:\Users\kavin\Desktop\network project\backend"
python -m venv venv
.\venv\Scripts\pip.exe install torch --index-url https://download.pytorch.org/whl/cpu
.\venv\Scripts\pip.exe install -r requirements.txt
.\venv\Scripts\python.exe init_db.py
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```powershell
cd "c:\Users\kavin\Desktop\network project\frontend"
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 6. Supported Datasets & Schemas

The application includes automatic schema recognition and column mapping for major cybersecurity benchmarks:
- **CICIDS2017**: Auto-maps `Destination Port`, `Flow Duration`, `Total Fwd Packets`, `Flow Bytes/s`, `FIN/SYN/RST Flags`, and `Label`.
- **CSE-CIC-IDS2018**: Auto-maps `Dst Port`, `Protocol`, `Flow Duration`, and `Label`.
- **UNSW-NB15**: Auto-maps `dur`, `proto`, `service`, `state`, and `attack_cat`.
- **Custom CSV**: Any tabular CSV network capture with a `Label`, `class`, or `target` column.

Pre-seeded in `backend/data/datasets/`:
- `CICIDS2017_Imbalanced_Benchmark.csv` (2,500 training flow vectors with 80% benign, 20% DoS Hulk, DDoS, PortScan, SSH-Patator, Botnet).
- `Unseen_Network_Traffic_Test.csv` (400 unlabelled flows for testing batch intrusion detection).

---

## 7. Network Monitoring Modes

### Controlled Demonstration Mode (Offline / Safe)
- Generates realistic, stochastic 5-tuple bidirectional network flow vectors (simulating benign HTTP/HTTPS/DNS traffic and intermittent threat injections).
- Evaluates flows against your active ML or DL model in real-time.
- Flags threats, computes confidence levels, and creates database alerts.
- **Zero permissions or Npcap installation required.**

### Physical Adapter Capture Mode
- Allows capturing live Ethernet / Wi-Fi packets using Scapy.
- To use live physical packet capture on Windows:
  1. Install [Npcap for Windows](https://npcap.com/) (select "Install Npcap in WinPcap API-compatible Mode").
  2. Launch command prompt as Administrator.

---

## 8. College Project Verification & Testing Checklist

| Module | Feature / Requirement | Implementation Status | Tested & Verified |
| :--- | :--- | :--- | :--- |
| **Auth** | Login, JWT Token, Password Hashing (bcrypt), Role sessions | Completed | Verified (admin / analyst) |
| **Dashboard** | Total flows, normal/threat counts, macro metrics, charts | Completed | Verified (Real DB queries) |
| **Datasets** | CSV Upload, Schema Detection, Preview, Null/Duplicate counts | Completed | Verified (CICIDS2017 schema) |
| **Preprocessing** | SMOTE, Random Undersample, Class Weights, Scaling | Completed | Verified (Zero-leakage split) |
| **ML Models** | Random Forest, XGBoost, Decision Tree, Support Vector Machine | Completed | Verified (Scikit-learn / XGBoost) |
| **DL Models** | Deep Neural Network (ANN) & Temporal Windowing LSTM | Completed | Verified (PyTorch CPU) |
| **Comparison** | Macro-F1, Minority Recall, Confusion Matrix, FPR/FNR | Completed | Verified (Benchmarked matrix) |
| **Detection** | Unseen CSV upload, Batch ML prediction, Results CSV export | Completed | Verified (400 flows in 0.1s) |
| **Monitoring** | Live flow aggregation, model inference, alert trigger | Completed | Verified (Demo & Scapy agent) |
| **Alerts** | Incident queue, severity filters, triage status update | Completed | Verified (NEW / INVESTIGATING) |
| **Reports** | Formal PDF document & CSV data export | Completed | Verified (ReportLab vector PDF) |
| **Settings** | Confidence threshold, flow timeout, email recipient | Completed | Verified (Persistent DB settings) |
| **Handover** | start.bat, stop.bat, requirements.txt, .env.example | Completed | Verified (Automated Windows scripts) |

---

## 9. Academic Project Defense & Viva Tips

1. **Why is Macro-F1 prioritized over Accuracy?**
   In imbalanced datasets (e.g., 98% Benign, 2% Attacks), an untrained model predicting all samples as "Benign" achieves 98% accuracy but 0% threat detection. Macro-F1 weights each class equally, exposing models that fail on minority attacks.
2. **How was Data Leakage avoided during SMOTE resampling?**
   Resampling was performed exclusively on `X_train` and `y_train` after stratified splitting. `X_test` remained completely untouched, preserving true real-world class distributions during evaluation.
3. **How does the LSTM model process tabular network flows?**
   Consecutive network flows are grouped into temporal sequence windows ($L=5$) representing flow bursts over time, allowing the recurrent network to learn attack progression patterns (e.g., port scans and brute force bursts).

