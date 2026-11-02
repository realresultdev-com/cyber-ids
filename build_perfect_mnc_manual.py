import os
import subprocess
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def generate_perfect_html():
    html = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Student Setup & Demonstration Manual | NetGuard SOC</title>
<style>
  body {
    font-family: Arial, 'Segoe UI', Helvetica, sans-serif;
    color: #1E293B;
    background-color: #F8FAFC;
    margin: 0;
    padding: 20px;
    line-height: 1.5;
  }
  .doc-wrapper {
    max-width: 860px;
    margin: 0 auto;
    background-color: #FFFFFF;
    padding: 40px 50px;
    border: 1px solid #E2E8F0;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }
  table.frame-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.frame-table td {
    padding: 16px 20px;
    vertical-align: top;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 24px 0;
    font-size: 13.5px;
  }
  table.data-table th {
    background-color: #0F233C;
    color: #FFFFFF;
    text-align: left;
    padding: 11px 14px;
    font-weight: bold;
    border: 1px solid #0F233C;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  table.data-table td {
    padding: 10px 14px;
    border: 1px solid #CBD5E1;
    vertical-align: top;
    color: #1E293B;
  }
  table.data-table tr:nth-child(even) td {
    background-color: #F8FAFC;
  }
  .badge-tag {
    display: inline-block;
    background-color: #EFF6FF;
    color: #1D4ED8;
    border: 1px solid #BFDBFE;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 0.5px;
    border-radius: 3px;
    text-transform: uppercase;
  }
  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #0F233C;
    margin-top: 28px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #2563EB;
    display: flex;
    align-items: center;
  }
  .btn-download {
    display: inline-block;
    background-color: #2563EB;
    color: #FFFFFF !important;
    text-decoration: none;
    font-weight: bold;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    margin: 10px 0;
  }
  .code-text {
    font-family: Consolas, 'Courier New', monospace;
    font-size: 12.5px;
    background-color: #F1F5F9;
    padding: 2px 5px;
    border: 1px solid #CBD5E1;
    border-radius: 3px;
    color: #0F172A;
  }
  .url-link {
    font-family: Consolas, 'Courier New', monospace;
    font-size: 12px;
    color: #1D4ED8;
    word-break: break-all;
  }
  .alert-critical {
    color: #B91C1C;
    font-weight: bold;
  }
  .qa-box {
    background-color: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-left: 4px solid #0F233C;
    padding: 12px 16px;
    margin-bottom: 14px;
  }
  .qa-box strong {
    color: #0F233C;
    font-size: 14px;
    display: block;
    margin-bottom: 4px;
  }
  .qa-box p {
    margin: 0;
    font-size: 13.5px;
    color: #334155;
  }
</style>
</head>
<body>

<div class="doc-wrapper">

  <!-- TOP HEADER FRAME -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 3px solid #2563EB; padding-bottom: 16px;">
    <tr>
      <td style="padding: 0 0 16px 0;">
        <span class="badge-tag">ENTERPRISE SOC SPECIFICATION // FINAL YEAR ACADEMIC MANUAL</span>
        <h1 style="font-size: 24px; color: #0F233C; margin: 10px 0 6px 0; font-weight: bold; font-family: Arial, sans-serif;">
          Student Setup & Demonstration Manual
        </h1>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #475569;">
          <strong>Project Title:</strong> Intrusion Detection of Imbalanced Network Traffic Using Machine Learning and Deep Learning
        </p>
        <p style="margin: 0; font-size: 13px; color: #64748B;">
          <strong>Platform Architecture:</strong> NetGuard Cybersecurity Operations Center (SOC) & Threat Analysis Engine | v2.4 Enterprise Edition
        </p>
      </td>
    </tr>
  </table>

  <!-- 1. DOWNLOAD REPOSITORY FRAME -->
  <div class="section-title">1. Project Archive & Download Repository</div>
  
  <table style="width: 100%; border-collapse: collapse; background-color: #F0F7FF; border: 1px solid #BFDBFE; border-left: 5px solid #2563EB; margin: 14px 0 20px 0;">
    <tr>
      <td style="padding: 18px 22px;">
        <div style="font-size: 14.5px; font-weight: bold; color: #0F233C; margin-bottom: 8px;">
          📦 OFFICIAL PROJECT DOWNLOAD REPOSITORY (GOOGLE DRIVE)
        </div>
        
        <div style="margin: 10px 0;">
          <a class="btn-download" href="https://drive.google.com/file/d/1WTM26IUjIDnQBVSks_DLY9SLFLwc1kd8/view?usp=sharing" target="_blank">
            ⬇️ Click Here to Download Project ZIP Archive (~1.2 MB)
          </a>
        </div>
        
        <div style="margin-top: 8px; font-size: 12.5px; color: #475569;">
          <strong>Direct Browser Link:</strong><br>
          <a class="url-link" href="https://drive.google.com/file/d/1WTM26IUjIDnQBVSks_DLY9SLFLwc1kd8/view?usp=sharing" target="_blank">
            https://drive.google.com/file/d/1WTM26IUjIDnQBVSks_DLY9SLFLwc1kd8/view?usp=sharing
          </a>
        </div>
        
        <div style="margin-top: 12px; font-size: 12.5px; color: #334155; line-height: 1.6; border-top: 1px solid #DBEAFE; padding-top: 10px;">
          • <strong>Archive Name:</strong> <span class="code-text">Network_Intrusion_Detection_Project.zip</span> (Ultra-lightweight: ~1.2 MB)<br>
          • <strong>Included Artifacts:</strong> Complete FastAPI backend, React 18 frontend, CICIDS2017 benchmark datasets (<span class="code-text">CICIDS2017_Imbalanced_Benchmark.csv</span>, <span class="code-text">test_data.npz</span>), trained ML models (Random Forest, XGBoost), PyTorch Deep Learning ANN model weights, SQLite database, and automated Windows batch runners.<br>
          • <strong>Zero Manual Configuration:</strong> Dependencies and virtual environments are provisioned automatically on launch.
        </div>
      </td>
    </tr>
  </table>

  <!-- 2. PREREQUISITES FRAME -->
  <div class="section-title">2. System Prerequisites (Pre-Flight Checklist)</div>
  <p style="font-size: 13.5px; color: #475569; margin: 0 0 10px 0;">
    Verify that your Windows laptop has the following two standard runtimes installed before running the automation script:
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 26%;">Required Runtime</th>
        <th style="width: 34%;">Recommended Version & Link</th>
        <th style="width: 40%;">MNC Enterprise Setup Instruction</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Python Environment</strong></td>
        <td>
          <strong>Python 3.10 or 3.11 (64-bit)</strong><br>
          <a class="url-link" href="https://www.python.org/downloads/" target="_blank">https://www.python.org/downloads/</a>
        </td>
        <td>
          <span class="alert-critical">⚠️ CRITICAL DIRECTIVE:</span> You <strong>MUST</strong> check the box that says <strong>"Add Python to PATH"</strong> on the very first installer screen before clicking <em>Install Now</em>.
        </td>
      </tr>
      <tr>
        <td><strong>2. Node.js Engine</strong></td>
        <td>
          <strong>Node.js (LTS Version)</strong><br>
          <a class="url-link" href="https://nodejs.org/" target="_blank">https://nodejs.org/</a>
        </td>
        <td>
          Download standard Windows 64-bit installer (.msi). Click <em>Next</em> on default configuration options until completed. Powers the modern Vite dashboard.
        </td>
      </tr>
    </tbody>
  </table>

  <!-- 3. ONE-CLICK EXECUTION FRAME -->
  <div class="section-title">3. Quick Execution Protocol (One-Click Autonomous Deployment)</div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 14%;">Sequence</th>
        <th style="width: 36%;">Student Action</th>
        <th style="width: 50%;">Automated Engine Background Operations</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>STEP 01</strong></td>
        <td>
          <strong>Extract Project ZIP</strong><br>
          <span style="font-size: 12.5px; color: #475569;">
            Right-click <span class="code-text">Network_Intrusion_Detection_Project.zip</span> &rarr; select <strong>"Extract All..."</strong>.
          </span>
        </td>
        <td>
          Extracts the structured project hierarchy (backend, frontend, pre-trained models, CICIDS2017 datasets, SQLite database, and batch runners).
        </td>
      </tr>
      <tr>
        <td><strong>STEP 02</strong></td>
        <td>
          <strong>Launch System</strong><br>
          <span style="font-size: 12.5px; color: #475569;">
            Open extracted folder and double-click <span class="code-text">start.bat</span>.
          </span>
        </td>
        <td>
          The batch script automatically provisions the Python virtual environment (<span class="code-text">venv</span>), installs PyTorch, Scikit-learn, XGBoost, and FastAPI, runs <span class="code-text">npm install</span> for React, boots both servers, and opens <span class="url-link">http://localhost:5173</span> in your browser.
        </td>
      </tr>
      <tr>
        <td><strong>STEP 03</strong></td>
        <td>
          <strong>Graceful Shutdown</strong><br>
          <span style="font-size: 12.5px; color: #475569;">
            Double-click <span class="code-text">stop.bat</span> when finished.
          </span>
        </td>
        <td>
          Terminates background uvicorn and Vite processes cleanly across ports 8000 and 5173 without leaving orphaned socket bindings.
        </td>
      </tr>
    </tbody>
  </table>

  <!-- 4. CREDENTIALS FRAME -->
  <div class="section-title">4. Security Operations Center (SOC) Access Credentials</div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 28%;">Portal Interface</th>
        <th style="width: 26%;">Local Direct Endpoint</th>
        <th style="width: 26%;">Access Credentials</th>
        <th style="width: 20%;">Security Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>NetGuard SOC Portal</strong></td>
        <td><a class="url-link" href="http://localhost:5173" target="_blank">http://localhost:5173</a></td>
        <td>
          Username: <span class="code-text">admin</span><br>
          Password: <span class="code-text">admin123</span><br>
          <span style="font-size: 11px; color: #64748B;"><em>(Or click 'Admin (Full Access)' quick button)</em></span>
        </td>
        <td>Lead Security Analyst / SOC Administrator</td>
      </tr>
      <tr>
        <td><strong>FastAPI Swagger API</strong></td>
        <td><a class="url-link" href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a></td>
        <td><span class="code-text">Open Access</span> (Interactive UI)</td>
        <td>Systems Engineer / Backend Examiner</td>
      </tr>
    </tbody>
  </table>

  <!-- 5. COLLEGE VIVA DEMONSTRATION WORKFLOW -->
  <div class="section-title">5. College Viva / Examiner Demonstration Walkthrough (7 Milestones)</div>
  <p style="font-size: 13.5px; color: #475569; margin: 0 0 10px 0;">
    Follow this exact step-by-step presentation script during your external college viva evaluation:
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 8%;">Seq</th>
        <th style="width: 24%;">Demonstration Module</th>
        <th style="width: 18%;">Route / Trigger</th>
        <th style="width: 50%;">External Examiner Viva Talking Point</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>01</strong></td>
        <td><strong>SOC Executive Overview</strong></td>
        <td><span class="code-text">/</span></td>
        <td>Demonstrate real-time traffic ingress rates, monitored host topology (Web Servers, API Gateways, Firewalls), and baseline model Macro-F1 benchmark (98.4%).</td>
      </tr>
      <tr>
        <td><strong>02</strong></td>
        <td><strong>Live Ingress Flow Monitor</strong></td>
        <td><span class="code-text">/live</span></td>
        <td>
          Select a model (Random Forest or PyTorch ANN) and click <strong>"START CAPTURE"</strong>.<br>
          Show that ~85% of traffic is normal BENIGN (neutral dark slate with green badge), while ~15% of true intrusions (DoS Hulk, DDoS Flood, SSH-Patator) are flagged in red.<br>
          Point out the <strong>"TARGET APP / SERVICE"</strong> column (e.g. OpenSSH Port 22, HTTP Web Port 80, API Gateway Port 8080).
        </td>
      </tr>
      <tr>
        <td><strong>03</strong></td>
        <td><strong>Deep Forensic Inspector</strong></td>
        <td><span class="code-text">Modal [INSPECT]</span></td>
        <td>
          Click <strong>"INSPECT"</strong> on any threat flow (e.g., SSH-Patator on Port 22).<br>
          Showcase the <strong>Affected Application & Security Impact Analysis</strong> card: displays the affected daemon (<span class="code-text">sshd.service</span>), security blast radius, and tactical SOC mitigation recommendation.
        </td>
      </tr>
      <tr>
        <td><strong>04</strong></td>
        <td><strong>Class Imbalance Laboratory</strong></td>
        <td><span class="code-text">/imbalance-analysis</span></td>
        <td>Explain the "Accuracy Paradox" in cybersecurity traffic. Demonstrate SMOTE synthetic boundary sampling and Cost-Sensitive Class Weighting to detect rare zero-day intrusions.</td>
      </tr>
      <tr>
        <td><strong>05</strong></td>
        <td><strong>Deep Learning Neural Lab</strong></td>
        <td><span class="code-text">/deep-learning</span></td>
        <td>Walk through the PyTorch Multi-Layer Perceptron architecture (78 input features &rarr; 128 hidden &rarr; 64 hidden &rarr; Softmax) and loss convergence graphs.</td>
      </tr>
      <tr>
        <td><strong>06</strong></td>
        <td><strong>Multi-Model Benchmark</strong></td>
        <td><span class="code-text">/comparison</span></td>
        <td>Present the comparative performance matrix contrasting Random Forest, XGBoost, and Deep Neural Networks across Macro-F1, Precision, and Recall.</td>
      </tr>
      <tr>
        <td><strong>07</strong></td>
        <td><strong>Official Audit & PDF Report</strong></td>
        <td><span class="code-text">/reports</span></td>
        <td>Click <strong>"GENERATE AUDIT REPORT"</strong> to export official SOC forensic verification documentation in PDF and CSV format for project evaluation submission.</td>
      </tr>
    </tbody>
  </table>

  <!-- 6. VIVA ORAL Q&A CHEAT SHEET -->
  <div class="section-title">6. Viva Defense Oral Examination Reference (High-Impact Q&A)</div>

  <div class="qa-box">
    <strong>Q1: Why was the CICIDS2017 benchmark dataset chosen for this research?</strong>
    <p>A: CICIDS2017 reflects realistic enterprise network traffic containing natural class distributions (over 85% Benign traffic and rare minority attack vectors like SSH-Patator, DoS Hulk, and PortScan). It extracts 78 comprehensive bidirectional flow statistics based on network 5-tuples.</p>
  </div>

  <div class="qa-box">
    <strong>Q2: Why is raw Classification Accuracy misleading for Intrusion Detection Systems?</strong>
    <p>A: In an imbalanced environment where 85% of traffic is Benign, a naive classifier that predicts 100% Benign achieves 85% raw accuracy while missing 100% of malicious intrusions. Therefore, Macro-F1 score, Precision-Recall AUC, and Minority Recall are the mathematically rigorous evaluation criteria.</p>
  </div>

  <div class="qa-box">
    <strong>Q3: How does network packet-to-flow aggregation function in practice?</strong>
    <p>A: Individual raw network packets are aggregated into bidirectional flows defined by their standard 5-tuple: (Source IP, Destination IP, Source Port, Destination Port, Protocol). Once a TCP FIN/RST termination flag or inactivity timeout occurs, the engine computes 78 statistical features (flow duration, inter-arrival time, packet length statistics) for ML inference.</p>
  </div>

  <div class="qa-box">
    <strong>Q4: How does SMOTE resolve the minority attack detection challenge?</strong>
    <p>A: Synthetic Minority Over-sampling Technique (SMOTE) overcomes simple random oversampling overfitting by generating synthetic feature vectors along the feature-space line segments connecting k-nearest minority neighbors, enabling classifiers to learn robust decision boundaries.</p>
  </div>

  <!-- 7. TROUBLESHOOTING FRAME -->
  <div class="section-title">7. Enterprise Operational Troubleshooting & Diagnostics</div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 28%;">Observed Symptom</th>
        <th style="width: 32%;">Underlying Technical Root Cause</th>
        <th style="width: 40%;">MNC Standard Remediation Procedure</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Ports 8000 or 5173 Busy</strong></td>
        <td>Previous development session or orphaned background processes holding socket binding.</td>
        <td>Double-click <span class="code-text">stop.bat</span> in the project root to terminate existing processes, then execute <span class="code-text">start.bat</span>.</td>
      </tr>
      <tr>
        <td><strong>Python Not Recognized in CMD</strong></td>
        <td>Python was installed without registering executables in the Windows system environment PATH variable.</td>
        <td>Re-run the Python installer, select <em>Modify</em>, check the box <strong>"Add Python to PATH"</strong>, and finish installation.</td>
      </tr>
      <tr>
        <td><strong>Browser Does Not Auto-Launch</strong></td>
        <td>Windows default browser association delayed or security prompt pending.</td>
        <td>Manually open Chrome, Edge, or Firefox and navigate to <a class="url-link" href="http://localhost:5173" target="_blank">http://localhost:5173</a>.</td>
      </tr>
    </tbody>
  </table>

  <!-- FOOTER -->
  <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #CBD5E1; margin-top: 30px;">
    <tr>
      <td style="padding-top: 14px; text-align: center; font-size: 11.5px; color: #64748B;">
        NetGuard Cybersecurity Operations Center &bull; Enterprise SOC Demonstration Manual &bull; Confidential &copy; 2026
      </td>
    </tr>
  </table>

</div>

</body>
</html>
"""
    return html

def main():
    desktop_html = r"c:\Users\kavin\Desktop\Student_Project_Manual_MNC_Edition.html"
    content = generate_perfect_html()
    with open(desktop_html, "w", encoding="utf-8") as f:
        f.write(content)
    print("Saved perfected HTML to:", desktop_html)

if __name__ == "__main__":
    main()

