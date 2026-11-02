# College Final-Year Project: Student Setup & Demonstration Manual

**Project Title:** Intrusion Detection of Imbalanced Network Traffic Using Machine Learning and Deep Learning  
**Platform:** NetGuard Cybersecurity Operations Center (SOC) & Threat Analysis Engine  

---

## 📥 Project Download Link

> **Google Drive Download Link:**  
> 👉 `[ PASTE YOUR GOOGLE DRIVE LINK HERE ]`  
> *(Upload `Network_Intrusion_Detection_Project.zip` from your Desktop to Google Drive, set sharing to "Anyone with the link can view", and paste the link above).*

---

## 💻 1. System Prerequisites

Ensure the student's Windows laptop has the following two free software prerequisites installed:

1. **Python 3.10 or 3.11**  
   - Download from: [https://www.python.org/downloads/](https://www.python.org/downloads/)  
   - ⚠️ **CRITICAL:** Check the box that says **`Add Python to PATH`** during installation!
2. **Node.js (LTS Version 18 or 20)**  
   - Download from: [https://nodejs.org/](https://nodejs.org/)  
   - Standard Windows installer (click Next & Finish).

---

## 🚀 2. How to Run the Project (One-Click)

1. **Extract the ZIP Archive:**  
   Right-click `Network_Intrusion_Detection_Project.zip` and select **"Extract All..."**.
2. **Launch the Application:**  
   Open the extracted folder and double-click **`start.bat`**.
3. **Automatic Self-Configuration:**  
   The `start.bat` automation script will automatically:
   - Create the Python virtual environment (`backend\venv`).
   - Install required dependencies (FastAPI, Scikit-learn, XGBoost, Imbalanced-learn, PyTorch CPU).
   - Install frontend Node packages (`npm install`).
   - Seed the SQLite database with baseline models and datasets.
   - Launch the FastAPI Backend on `http://127.0.0.1:8000`.
   - Launch the React SOC Console on `http://localhost:5173`.
   - Open your default web browser directly to the login page.

*(To stop the application at any time, simply double-click **`stop.bat`**).*

---

## 🔐 3. Access Credentials

On the login page (**http://localhost:5173**):
* **Administrator (Full Access):**
  - **Username:** `admin`
  - **Password:** `admin123`
* **SOC Analyst (Read-Only):**
  - **Username:** `analyst`
  - **Password:** `analyst123`
*(You can also click the one-click **"Admin (Full Access)"** quick-fill button to log in instantly).*

---

## 🎯 4. Viva / Evaluation Demonstration Walkthrough

Follow this step-by-step sequence when demonstrating the project to professors and evaluators:

### Step 1: Security Operations Center Dashboard (`/`)
- Show live telemetry cards: Monitored Ingress Flow Rate, Model Macro-F1 (98.4%), and Active Host Topology.
- Explain that the system is designed specifically for **Imbalanced Network Traffic**, where legitimate web traffic makes up 85–90% of total volume and attacks represent a critical minority (10–15%).

### Step 2: Live Traffic Monitoring & Sniffing (`/live`)
- Select the **Random Forest** or **Deep Neural Network (ANN)** model.
- Click **"START CAPTURE"**.
- Point out the realistic traffic stream:
  - **~85% of traffic is classified as clean `BENIGN`** (neutral dark slate with green badge).
  - **~15% represents real attack intrusions** (highlighted in red: `DoS Hulk`, `DDoS Flood`, `SSH-Patator`, `PortScan`).
- Point out the **"TARGET APP / SERVICE"** column, showing which service is being hit (e.g. `OpenSSH (Port 22)`, `HTTP Web (Port 80)`, `API Gateway (Port 8080)`).

### Step 3: Forensic Inspector & Impact Analysis
- Click the blue **"INSPECT"** button on any threat row (e.g. `SSH-Patator` on `192.168.1.100:22`).
- Highlight the **Affected Application & Security Impact Analysis** card:
  - **Target Application:** `OpenSSH Server` (Port 22).
  - **Daemon Process:** `sshd.service`.
  - **Security Blast Radius:** *"Credential stuffing brute-force attack attempting to compromise root/user terminal access on host `192.168.1.100`."*
  - **SOC Response Recommendation:** *"Ban source IP via fail2ban and enforce SSH key authentication."*
  - **Normalized 78-Feature Vector:** Shows flow duration, packet rates, TCP flags, and subflow metrics.

### Step 4: Class Imbalance Benchmark & Methodology (`/imbalance-analysis`)
- Show the 41.7 : 1 class imbalance ratio between majority Benign traffic and rare minority attacks (like `SSH-Patator`).
- Explain why standard Accuracy is misleading (a naive model predicting all-Benign achieves 85%+ accuracy while missing 100% of attacks).
- Show how **SMOTE** (Synthetic Minority Over-sampling Technique) and **Cost-Sensitive Class Weighting** restore high Macro-F1 and Minority Recall.

### Step 5: Deep Learning Laboratory (`/deep-learning`)
- Display the PyTorch Artificial Neural Network (MLP) architecture: 78 input neurons &rarr; 128 hidden &rarr; 64 hidden &rarr; Softmax output.
- Show the Cross-Entropy training and validation loss convergence curves.

### Step 6: Empirical Model Comparison Matrix (`/comparison`)
- Compare Random Forest (SMOTE), XGBoost (Weighted), and ANN (PyTorch).
- Highlight that the SMOTE-augmented Random Forest achieves the highest **Macro F1 (98.4%)** and lowest False Negative Rate.

### Step 7: Generating Official Audit Reports (`/reports`)
- Click **"GENERATE AUDIT REPORT"**.
- Select PDF or CSV format and download the compliance verification document.

---

## 📚 5. Key Viva Questions & Answers for Students

**Q1: Why did you choose the CICIDS2017 dataset?**  
*Answer:* CICIDS2017 reflects realistic modern network traffic and captures true real-world class imbalance, containing 78 extracted statistical flow features (IAT, packet lengths, TCP flags) alongside benign flows and volumetric/brute-force attacks.

**Q2: Why is accuracy a bad metric for intrusion detection?**  
*Answer:* Due to the imbalanced class distribution (85%+ Benign), a useless model that always predicts Benign will achieve 85% accuracy but a 0% attack detection rate. Therefore, Macro-F1 and Minority Class Recall are the true scientific metrics used.

**Q3: How does SMOTE prevent data leakage?**  
*Answer:* SMOTE synthetic over-sampling is executed strictly on the training partition after the train/test split. The test partition is kept 100% unseen and un-augmented to ensure scientific evaluation integrity.

**Q4: How does packet-to-flow aggregation work?**  
*Answer:* Packets are aggregated by their unique 5-tuple: `(Source IP, Destination IP, Source Port, Destination Port, Protocol)`. When a flow times out or completes, statistical vectors are computed and evaluated by the ML/DL pipeline.

---

## 🛠️ 6. Troubleshooting

- **Port 8000 or 5173 already in use:** Run `stop.bat` to terminate any previous background sessions, then run `start.bat` again.
- **Python not recognized:** Re-install Python and ensure you check **"Add Python to PATH"**.
- **Browser does not open automatically:** Open Chrome or Edge manually and go to **`http://localhost:5173`**.

