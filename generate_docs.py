import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL

def build_docx(output_path):
    doc = docx.Document()
    
    # Page Margins (0.75 in for modern executive feel)
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
        # Header & Footer setup
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("NetGuard SOC Enterprise Manual | Academic Defense Edition")
        hrun.font.name = "Segoe UI"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(148, 163, 184) # Slate 400
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Confidential — For Academic & Technical Demonstration Only")
        frun.font.name = "Segoe UI"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # Styles helper
    NAVY = RGBColor(15, 35, 60)      # #0F233C
    BLUE = RGBColor(37, 99, 235)     # #2563EB
    SLATE = RGBColor(71, 85, 105)    # #475569
    DARK = RGBColor(15, 23, 42)      # #0F172A
    WHITE = RGBColor(255, 255, 255)
    GREEN = RGBColor(22, 101, 52)    # #166534

    def format_run(run, font_name="Segoe UI", size_pt=10.5, color=DARK, bold=False, italic=False):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.font.color.rgb = color
        run.bold = bold
        run.italic = italic

    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_cell_borders(cell, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0", sz="4"):
        tcPr = cell._tc.get_or_add_tcPr()
        borders_xml = f'<w:tcBorders {nsdecls("w")}>'
        for side, color in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            if color:
                borders_xml += f'<w:{side} w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            else:
                borders_xml += f'<w:{side} w:val="none"/>'
        borders_xml += '</w:tcBorders>'
        tcPr.append(parse_xml(borders_xml))

    # --- TITLE BLOCK ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_badge = title_p.add_run("ENTERPRISE DEFENSE MANUAL // CYBERSECURITY SOC\n")
    format_run(run_badge, "Segoe UI", 9, BLUE, bold=True)
    
    run_title = title_p.add_run("Student Setup & Demonstration Manual")
    format_run(run_title, "Segoe UI", 24, NAVY, bold=True)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(2)
    sub_p.paragraph_format.space_after = Pt(14)
    run_sub1 = sub_p.add_run("Project: ")
    format_run(run_sub1, "Segoe UI", 11, SLATE, bold=True)
    run_sub2 = sub_p.add_run("Intrusion Detection of Imbalanced Network Traffic Using Machine Learning and Deep Learning\n")
    format_run(run_sub2, "Segoe UI", 11, DARK)
    run_sub3 = sub_p.add_run("Platform: ")
    format_run(run_sub3, "Segoe UI", 10, SLATE, bold=True)
    run_sub4 = sub_p.add_run("NetGuard Cybersecurity Operations Center (SOC) & Threat Analysis Engine | Version 2.4")
    format_run(run_sub4, "Segoe UI", 10, SLATE, italic=True)

    # Divider bar
    div_p = doc.add_paragraph()
    div_p.paragraph_format.space_before = Pt(0)
    div_p.paragraph_format.space_after = Pt(14)
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="18" w:space="1" w:color="2563EB"/></w:pBdr>')
    div_p._p.get_or_add_pPr().append(pBdr)

    # --- SECTION 1: DOWNLOAD CALLOUT BOX ---
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. Project Archive & Download Repository")
    format_run(r_h1, "Segoe UI", 14, NAVY, bold=True)

    card_table = doc.add_table(rows=1, cols=1)
    card_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    card_cell = card_table.rows[0].cells[0]
    card_cell.width = Inches(7.0)
    set_cell_background(card_cell, "F0F7FF") # soft ice blue
    set_cell_margins(card_cell, top=160, bottom=160, left=220, right=220)
    # thick left accent border in blue, subtle border elsewhere
    set_cell_borders(card_cell, top="BFDBFE", bottom="BFDBFE", left="2563EB", right="BFDBFE", sz="18")

    cp = card_cell.paragraphs[0]
    cp.paragraph_format.space_after = Pt(4)
    r_card_title = cp.add_run("📦 OFFICIAL PROJECT DOWNLOAD LINK (GOOGLE DRIVE)\n")
    format_run(r_card_title, "Segoe UI", 11, NAVY, bold=True)
    
    r_card_url = cp.add_run("https://drive.google.com/file/d/1WTM26IUjIDnQBVSks_DLY9SLFLwc1kd8/view?usp=sharing\n\n")
    format_run(r_card_url, "Consolas", 10.5, BLUE, bold=True)

    r_card_desc = cp.add_run(
        "• Archive Name: Network_Intrusion_Detection_Project.zip  (Size: ~1.2 MB lightweight package)\n"
        "• Package Contents: Complete Full-Stack Code (FastAPI + React), CICIDS2017 Benchmark Datasets, Pre-Trained Machine Learning & Deep Learning Models (Random Forest, XGBoost, PyTorch ANN), SQLite Database, and One-Click Startup Automation Scripts.\n"
        "• Note: Virtual environments and node packages are automatically generated on first run."
    )
    format_run(r_card_desc, "Segoe UI", 9.5, DARK)

    # --- SECTION 2: PREREQUISITES ---
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. System Prerequisites (Pre-Flight Checklist)")
    format_run(r_h2, "Segoe UI", 14, NAVY, bold=True)

    p_prereq_intro = doc.add_paragraph()
    p_prereq_intro.paragraph_format.space_after = Pt(6)
    r_pi = p_prereq_intro.add_run("Before running the automated launcher, confirm that your host machine has the following two standard development runtimes installed:")
    format_run(r_pi, "Segoe UI", 10.5, DARK)

    # Prerequisites Table
    t_prereq = doc.add_table(rows=3, cols=3)
    t_prereq.alignment = WD_TABLE_ALIGNMENT.CENTER
    prereq_headers = ["Runtime Component", "Required Version & Download Link", "Critical Installation Instruction"]
    prereq_widths = [Inches(1.8), Inches(2.6), Inches(2.6)]

    for i, col_name in enumerate(prereq_headers):
        c = t_prereq.rows[0].cells[i]
        c.width = prereq_widths[i]
        set_cell_background(c, "1E293B")
        set_cell_margins(c, top=120, bottom=120, left=140, right=140)
        set_cell_borders(c, top="1E293B", bottom="1E293B", left="1E293B", right="1E293B")
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(col_name)
        format_run(r, "Segoe UI", 9.5, WHITE, bold=True)

    prereq_data = [
        ("Python Environment", "Python 3.10 or 3.11\nhttps://www.python.org/downloads/", "⚠️ CRITICAL: You MUST check the box 'Add Python to PATH' on the first installer window before clicking Install Now."),
        ("Node.js Runtime", "Node.js (LTS Version)\nhttps://nodejs.org/", "Standard Windows Installation. Click 'Next' on all default prompts until completed. Powers the Vite frontend engine.")
    ]

    for row_idx, row_data in enumerate(prereq_data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            c = t_prereq.rows[row_idx].cells[col_idx]
            c.width = prereq_widths[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=100, bottom=100, left=140, right=140)
            set_cell_borders(c, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = c.paragraphs[0]
            if "CRITICAL" in text:
                parts = text.split("⚠️ CRITICAL:")
                r_warn = p.add_run("⚠️ CRITICAL:")
                format_run(r_warn, "Segoe UI", 9.5, RGBColor(185, 28, 28), bold=True)
                r_rest = p.add_run(parts[1])
                format_run(r_rest, "Segoe UI", 9.5, DARK)
            elif "http" in text:
                lines = text.split("\n")
                r1 = p.add_run(lines[0] + "\n")
                format_run(r1, "Segoe UI", 9.5, DARK, bold=True)
                r2 = p.add_run(lines[1])
                format_run(r2, "Consolas", 8.5, BLUE)
            else:
                r = p.add_run(text)
                format_run(r, "Segoe UI", 9.5, DARK, bold=(col_idx==0))

    # --- SECTION 3: ONE-CLICK EXECUTION ---
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(16)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. Quick Execution Protocol (One-Click Automated Deployment)")
    format_run(r_h3, "Segoe UI", 14, NAVY, bold=True)

    t_exec = doc.add_table(rows=4, cols=3)
    t_exec.alignment = WD_TABLE_ALIGNMENT.CENTER
    exec_headers = ["Phase", "Student Action", "Autonomous Engine Background Operations"]
    exec_widths = [Inches(1.2), Inches(2.6), Inches(3.2)]

    for i, col_name in enumerate(exec_headers):
        c = t_exec.rows[0].cells[i]
        c.width = exec_widths[i]
        set_cell_background(c, "1E293B")
        set_cell_margins(c, top=120, bottom=120, left=140, right=140)
        set_cell_borders(c, top="1E293B", bottom="1E293B", left="1E293B", right="1E293B")
        p = c.paragraphs[0]
        r = p.add_run(col_name)
        format_run(r, "Segoe UI", 9.5, WHITE, bold=True)

    exec_steps = [
        ("Step 1", "Extract Archive\nRight-click Network_Intrusion_Detection_Project.zip and select 'Extract All...'.", "Extracts the structured project hierarchy (backend, frontend, models, data, and orchestration batch scripts)."),
        ("Step 2", "Launch System\nOpen the extracted folder and double-click start.bat.", "The automation script verifies Python/Node.js, generates the Python virtual environment (venv), installs PyTorch, Scikit-learn, XGBoost, and FastAPI, executes 'npm install', boots both servers, and opens http://localhost:5173 automatically in your browser."),
        ("Step 3", "System Teardown\nDouble-click stop.bat at any time to shut down the platform.", "Gracefully terminates active background processes across ports 8000 and 5173 without leaving lingering zombie ports.")
    ]

    for row_idx, (phase, action, backend_op) in enumerate(exec_steps, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate([phase, action, backend_op]):
            c = t_exec.rows[row_idx].cells[col_idx]
            c.width = exec_widths[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=100, bottom=100, left=140, right=140)
            set_cell_borders(c, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = c.paragraphs[0]
            if col_idx == 0:
                r = p.add_run(text)
                format_run(r, "Segoe UI", 9.5, NAVY, bold=True)
            elif col_idx == 1:
                lines = text.split("\n")
                r_title = p.add_run(lines[0] + "\n")
                format_run(r_title, "Segoe UI", 9.5, DARK, bold=True)
                r_desc = p.add_run(lines[1])
                format_run(r_desc, "Segoe UI", 9, SLATE)
            else:
                r = p.add_run(text)
                format_run(r, "Segoe UI", 9, DARK)

    # --- SECTION 4: LOGIN CREDENTIALS ---
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(16)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("4. Security Operations Center (SOC) Access Credentials")
    format_run(r_h4, "Segoe UI", 14, NAVY, bold=True)

    t_cred = doc.add_table(rows=3, cols=4)
    t_cred.alignment = WD_TABLE_ALIGNMENT.CENTER
    cred_headers = ["Portal Interface", "Direct URL", "Security Credentials", "Demonstration Role"]
    cred_widths = [Inches(1.8), Inches(1.8), Inches(1.8), Inches(1.6)]

    for i, col_name in enumerate(cred_headers):
        c = t_cred.rows[0].cells[i]
        c.width = cred_widths[i]
        set_cell_background(c, "1E293B")
        set_cell_margins(c, top=120, bottom=120, left=140, right=140)
        set_cell_borders(c, top="1E293B", bottom="1E293B", left="1E293B", right="1E293B")
        p = c.paragraphs[0]
        r = p.add_run(col_name)
        format_run(r, "Segoe UI", 9.5, WHITE, bold=True)

    cred_data = [
        ("NetGuard SOC Main Portal", "http://localhost:5173", "Username: admin\nPassword: admin123\n(Or click 'Admin (Full Access)' quick button)", "Lead SOC Analyst / Security Admin"),
        ("FastAPI Interactive API Docs", "http://localhost:8000/docs", "Open Access\n(Interactive Swagger UI)", "System Engineer / Backend Examiner")
    ]

    for row_idx, row_vals in enumerate(cred_data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(row_vals):
            c = t_cred.rows[row_idx].cells[col_idx]
            c.width = cred_widths[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=100, bottom=100, left=140, right=140)
            set_cell_borders(c, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = c.paragraphs[0]
            if col_idx == 0:
                r = p.add_run(val)
                format_run(r, "Segoe UI", 9.5, DARK, bold=True)
            elif col_idx == 1:
                r = p.add_run(val)
                format_run(r, "Consolas", 9, BLUE)
            elif col_idx == 2:
                r = p.add_run(val)
                format_run(r, "Consolas", 8.5, DARK)
            else:
                r = p.add_run(val)
                format_run(r, "Segoe UI", 9, SLATE)

    # --- SECTION 5: COLLEGE VIVA DEMO WALKTHROUGH ---
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(16)
    h5.paragraph_format.space_after = Pt(6)
    r_h5 = h5.add_run("5. College Viva / Examiner Demonstration Walkthrough (7 Milestones)")
    format_run(r_h5, "Segoe UI", 14, NAVY, bold=True)

    p_viva_intro = doc.add_paragraph()
    p_viva_intro.paragraph_format.space_after = Pt(6)
    r_vi = p_viva_intro.add_run("Follow this systematic operational script during external viva evaluations to showcase every enterprise requirement:")
    format_run(r_vi, "Segoe UI", 10.5, DARK)

    viva_steps = [
        ("Step 1", "SOC Executive Overview", "/", "Show live ingress flow rate telemetry, monitored host infrastructure (Web Servers, API Gateways, Firewalls), and baseline Macro-F1 performance benchmark (98.4%)."),
        ("Step 2", "Live Traffic Monitor", "/live", "Select a model (Random Forest or PyTorch ANN) and click 'START CAPTURE'. Point out that ~85% of traffic is normal BENIGN (neutral dark slate with green badge), while ~15% of true intrusions (DoS Hulk, DDoS Flood, SSH-Patator) are flagged in red. Highlight the 'TARGET APP / SERVICE' column (OpenSSH Port 22, HTTP Web Port 80, API Gateway Port 8080)."),
        ("Step 3", "Deep Forensic Inspector", "Modal (Inspect)", "Click 'INSPECT' on any malicious threat row. Demonstrate the Affected Application & Security Impact Analysis card: displays the affected daemon (sshd.service), security blast radius, and tactical SOC mitigation recommendation."),
        ("Step 4", "Class Imbalance Lab", "/imbalance-analysis", "Explain the 'Accuracy Paradox' in cybersecurity traffic. Demonstrate SMOTE synthetic boundary sampling and Cost-Sensitive Class Weighting to detect rare zero-day intrusions."),
        ("Step 5", "Deep Learning Lab", "/deep-learning", "Walk through the PyTorch Multi-Layer Perceptron architecture (78 input features → 128 hidden → 64 hidden → Softmax) and loss convergence graphs."),
        ("Step 6", "Model Benchmark", "/comparison", "Present the comparative performance matrix contrasting Random Forest, XGBoost, and Deep Neural Networks across Macro-F1, Precision, and Recall."),
        ("Step 7", "Official Audit & PDF Report", "/reports", "Click 'GENERATE AUDIT REPORT' to export official SOC forensic verification documentation in PDF and CSV format for evaluation submission.")
    ]

    t_viva = doc.add_table(rows=8, cols=4)
    t_viva.alignment = WD_TABLE_ALIGNMENT.CENTER
    viva_headers = ["Seq", "Demonstration Module", "Portal Route", "Key Viva Defense Talking Point"]
    viva_widths = [Inches(0.8), Inches(1.8), Inches(1.4), Inches(3.0)]

    for i, col_name in enumerate(viva_headers):
        c = t_viva.rows[0].cells[i]
        c.width = viva_widths[i]
        set_cell_background(c, "1E293B")
        set_cell_margins(c, top=120, bottom=120, left=140, right=140)
        set_cell_borders(c, top="1E293B", bottom="1E293B", left="1E293B", right="1E293B")
        p = c.paragraphs[0]
        r = p.add_run(col_name)
        format_run(r, "Segoe UI", 9.5, WHITE, bold=True)

    for row_idx, (seq, module, route, point) in enumerate(viva_steps, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate([seq, module, route, point]):
            c = t_viva.rows[row_idx].cells[col_idx]
            c.width = viva_widths[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=100, bottom=100, left=140, right=140)
            set_cell_borders(c, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = c.paragraphs[0]
            if col_idx == 0:
                r = p.add_run(val)
                format_run(r, "Segoe UI", 9.5, NAVY, bold=True)
            elif col_idx == 1:
                r = p.add_run(val)
                format_run(r, "Segoe UI", 9.5, DARK, bold=True)
            elif col_idx == 2:
                r = p.add_run(val)
                format_run(r, "Consolas", 9, BLUE)
            else:
                r = p.add_run(val)
                format_run(r, "Segoe UI", 9, DARK)

    # --- SECTION 6: VIVA ORAL Q&A CHEAT SHEET ---
    h6 = doc.add_paragraph()
    h6.paragraph_format.space_before = Pt(16)
    h6.paragraph_format.space_after = Pt(6)
    r_h6 = h6.add_run("6. Viva Defense Oral Examination Reference (High-Impact Q&A)")
    format_run(r_h6, "Segoe UI", 14, NAVY, bold=True)

    qa_list = [
        ("Q1: Why was the CICIDS2017 benchmark dataset chosen for this research?",
         "A: CICIDS2017 reflects realistic enterprise network traffic containing natural class distributions (over 85% Benign traffic and rare minority attack vectors like SSH-Patator, DoS Hulk, and PortScan). It extracts 78 comprehensive bidirectional flow statistics based on network 5-tuples."),
        ("Q2: Why is raw Classification Accuracy misleading for Intrusion Detection Systems?",
         "A: In an imbalanced environment where 85% of traffic is Benign, a naive classifier that predicts 100% Benign achieves 85% raw accuracy while missing 100% of malicious intrusions. Therefore, Macro-F1 score, Precision-Recall AUC, and Minority Recall are the mathematically rigorous evaluation criteria."),
        ("Q3: How does network packet-to-flow aggregation function in practice?",
         "A: Individual raw network packets are aggregated into bidirectional flows defined by their standard 5-tuple: (Source IP, Destination IP, Source Port, Destination Port, Protocol). Once a TCP FIN/RST termination flag or inactivity timeout occurs, the engine computes 78 statistical features (flow duration, inter-arrival time, packet length statistics) for ML inference."),
        ("Q4: How does SMOTE resolve the minority attack detection challenge?",
         "A: Synthetic Minority Over-sampling Technique (SMOTE) overcomes simple random oversampling overfitting by generating synthetic feature vectors along the feature-space line segments connecting k-nearest minority neighbors, enabling classifiers to learn robust decision boundaries.")
    ]

    for q, a in qa_list:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(8)
        p_q.paragraph_format.space_after = Pt(2)
        r_q = p_q.add_run(q)
        format_run(r_q, "Segoe UI", 10.5, NAVY, bold=True)

        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_before = Pt(0)
        p_a.paragraph_format.space_after = Pt(6)
        r_a = p_a.add_run(a)
        format_run(r_a, "Segoe UI", 10, DARK)

    # --- SECTION 7: TROUBLESHOOTING ---
    h7 = doc.add_paragraph()
    h7.paragraph_format.space_before = Pt(16)
    h7.paragraph_format.space_after = Pt(6)
    r_h7 = h7.add_run("7. Enterprise Operational Troubleshooting & Diagnostics")
    format_run(r_h7, "Segoe UI", 14, NAVY, bold=True)

    t_diag = doc.add_table(rows=4, cols=3)
    t_diag.alignment = WD_TABLE_ALIGNMENT.CENTER
    diag_headers = ["Operational Issue", "Probable Root Cause", "Rapid MNC Resolution Protocol"]
    diag_widths = [Inches(2.0), Inches(2.2), Inches(2.8)]

    for i, col_name in enumerate(diag_headers):
        c = t_diag.rows[0].cells[i]
        c.width = diag_widths[i]
        set_cell_background(c, "1E293B")
        set_cell_margins(c, top=120, bottom=120, left=140, right=140)
        set_cell_borders(c, top="1E293B", bottom="1E293B", left="1E293B", right="1E293B")
        p = c.paragraphs[0]
        r = p.add_run(col_name)
        format_run(r, "Segoe UI", 9.5, WHITE, bold=True)

    diag_data = [
        ("Ports 8000 or 5173 Already Occupied", "Previous development session or orphaned background processes holding socket binding.", "Double-click stop.bat in the project directory to terminate existing processes, then run start.bat again."),
        ("Python Not Recognized in CMD", "Python was installed without registering executables in the Windows system environment PATH variable.", "Re-run the Python installer, select 'Modify', check the box 'Add Python to PATH', and complete installation."),
        ("Browser Does Not Launch Automatically", "Windows default browser association delayed or security prompt pending.", "Manually open Google Chrome, Microsoft Edge, or Firefox and navigate to http://localhost:5173.")
    ]

    for row_idx, row_vals in enumerate(diag_data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(row_vals):
            c = t_diag.rows[row_idx].cells[col_idx]
            c.width = diag_widths[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=100, bottom=100, left=140, right=140)
            set_cell_borders(c, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
            p = c.paragraphs[0]
            if col_idx == 0:
                r = p.add_run(val)
                format_run(r, "Segoe UI", 9.5, DARK, bold=True)
            elif col_idx == 1:
                r = p.add_run(val)
                format_run(r, "Segoe UI", 9, SLATE)
            else:
                r = p.add_run(val)
                format_run(r, "Segoe UI", 9, DARK)

    doc.save(output_path)
    print(f"DOCX successfully generated at: {output_path}")

def build_html(output_path):
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Setup & Demonstration Manual | NetGuard SOC</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    :root {
      --primary-navy: #0F233C;
      --accent-blue: #2563EB;
      --accent-blue-light: #F0F7FF;
      --slate-dark: #1E293B;
      --slate-body: #334155;
      --slate-muted: #64748B;
      --border-color: #E2E8F0;
      --bg-alt: #F8FAFC;
      --critical-red: #B91C1C;
      --success-green: #15803D;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #F1F5F9;
      color: var(--slate-body);
      line-height: 1.6;
      padding: 40px 20px;
    }

    .document-container {
      max-width: 850px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 60px 65px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--border-color);
    }

    .badge-bar {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--accent-blue);
      text-transform: uppercase;
      background: var(--accent-blue-light);
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid #BFDBFE;
      margin-bottom: 12px;
    }

    h1.doc-title {
      font-size: 2.1rem;
      font-weight: 700;
      color: var(--primary-navy);
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .meta-box {
      font-size: 0.95rem;
      color: var(--slate-muted);
      border-bottom: 2px solid var(--accent-blue);
      padding-bottom: 18px;
      margin-bottom: 28px;
    }

    .meta-box strong { color: var(--primary-navy); }

    h2.section-header {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-navy);
      margin-top: 32px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .download-card {
      background: var(--accent-blue-light);
      border-left: 5px solid var(--accent-blue);
      border-top: 1px solid #BFDBFE;
      border-right: 1px solid #BFDBFE;
      border-bottom: 1px solid #BFDBFE;
      padding: 22px 24px;
      border-radius: 6px;
      margin: 16px 0;
    }

    .download-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--primary-navy);
      margin-bottom: 8px;
    }

    .drive-link {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--accent-blue);
      background: #FFFFFF;
      padding: 8px 14px;
      border-radius: 5px;
      border: 1px solid #93C5FD;
      text-decoration: none;
      word-break: break-all;
      margin-bottom: 12px;
    }

    .drive-link:hover {
      text-decoration: underline;
      background: #EFF6FF;
    }

    .card-meta-list {
      font-size: 0.88rem;
      color: var(--slate-body);
      list-style-type: none;
      line-height: 1.55;
    }

    .card-meta-list li { margin-bottom: 4px; }
    .card-meta-list li strong { color: var(--primary-navy); }

    table.corporate-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 24px 0;
      font-size: 0.88rem;
    }

    table.corporate-table th {
      background-color: var(--slate-dark);
      color: #FFFFFF;
      text-align: left;
      padding: 10px 14px;
      font-weight: 600;
      font-size: 0.82rem;
      letter-spacing: 0.02em;
    }

    table.corporate-table td {
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      vertical-align: top;
    }

    table.corporate-table tr:nth-child(even) {
      background-color: var(--bg-alt);
    }

    .code-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      background-color: #F1F5F9;
      color: var(--slate-dark);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #CBD5E1;
    }

    .link-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      color: var(--accent-blue);
      font-weight: 600;
    }

    .critical-alert {
      color: var(--critical-red);
      font-weight: 600;
    }

    .qa-card {
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--primary-navy);
      padding: 14px 18px;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .qa-card strong {
      display: block;
      color: var(--primary-navy);
      font-size: 0.95rem;
      margin-bottom: 4px;
    }

    .qa-card p {
      font-size: 0.88rem;
      color: var(--slate-body);
      margin: 0;
    }

    .footer-note {
      text-align: center;
      font-size: 0.78rem;
      color: var(--slate-muted);
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
      margin-top: 36px;
    }
  </style>
</head>
<body>

<div class="document-container">

  <div class="badge-bar">ENTERPRISE DEFENSE MANUAL // CYBERSECURITY SOC</div>
  <h1 class="doc-title">Student Setup & Demonstration Manual</h1>
  
  <div class="meta-box">
    <div><strong>Project:</strong> Intrusion Detection of Imbalanced Network Traffic Using Machine Learning and Deep Learning</div>
    <div><strong>Platform:</strong> NetGuard Cybersecurity Operations Center (SOC) & Threat Analysis Engine | Version 2.4</div>
  </div>

  <h2 class="section-header">1. Project Archive & Download Repository</h2>
  <div class="download-card">
    <div class="download-card-title">📦 OFFICIAL PROJECT ARCHIVE LINK (GOOGLE DRIVE)</div>
    <a class="drive-link" href="https://drive.google.com/file/d/1WTM26IUjIDnQBVSks_DLY9SLFLwc1kd8/view?usp=sharing" target="_blank">
      https://drive.google.com/file/d/1WTM26IUjIDnQBVSks_DLY9SLFLwc1kd8/view?usp=sharing
    </a>
    <ul class="card-meta-list">
      <li><strong>Archive Name:</strong> Network_Intrusion_Detection_Project.zip (Lightweight package: ~1.2 MB)</li>
      <li><strong>Package Contents:</strong> Complete Full-Stack Code (FastAPI + React), CICIDS2017 Benchmark Datasets, Pre-Trained Machine Learning & Deep Learning Models (Random Forest, XGBoost, PyTorch ANN), SQLite Database, and One-Click Startup Automation Scripts.</li>
      <li><strong>Autonomous Generation:</strong> Virtual environments and node packages are automatically installed on first launch.</li>
    </ul>
  </div>

  <h2 class="section-header">2. System Prerequisites (Pre-Flight Checklist)</h2>
  <p style="font-size: 0.9rem; margin-bottom: 8px;">Ensure your Windows host laptop has these two standard development runtimes installed before executing the launch script:</p>
  
  <table class="corporate-table">
    <thead>
      <tr>
        <th style="width: 25%;">Runtime Component</th>
        <th style="width: 35%;">Required Version & Download Link</th>
        <th style="width: 40%;">Critical Installation Instruction</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Python Environment</strong></td>
        <td>
          Python 3.10 or 3.11<br>
          <a class="link-badge" href="https://www.python.org/downloads/" target="_blank">python.org/downloads</a>
        </td>
        <td>
          <span class="critical-alert">⚠️ CRITICAL:</span> You MUST check the box <strong>"Add Python to PATH"</strong> on the very first installer screen before clicking Install Now.
        </td>
      </tr>
      <tr>
        <td><strong>Node.js Runtime</strong></td>
        <td>
          Node.js (LTS Version)<br>
          <a class="link-badge" href="https://nodejs.org/" target="_blank">nodejs.org</a>
        </td>
        <td>Standard Windows installer. Click "Next" on all prompts until completed. Powers the modern Vite frontend SOC dashboard.</td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-header">3. Quick Execution Protocol (One-Click Deployment)</h2>
  <table class="corporate-table">
    <thead>
      <tr>
        <th style="width: 15%;">Phase</th>
        <th style="width: 35%;">Student Action</th>
        <th style="width: 50%;">Autonomous Background Operations</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Step 1</strong></td>
        <td><strong>Extract Archive</strong><br>Right-click <span class="code-badge">Network_Intrusion_Detection_Project.zip</span> and select <em>"Extract All..."</em>.</td>
        <td>Extracts the clean project hierarchy containing backend, frontend, models, data, and batch automation files.</td>
      </tr>
      <tr>
        <td><strong>Step 2</strong></td>
        <td><strong>Launch Platform</strong><br>Open the extracted folder and double-click <span class="code-badge">start.bat</span>.</td>
        <td>The script automatically creates the Python virtual environment (venv), installs PyTorch, Scikit-learn, XGBoost, and FastAPI, executes <span class="code-badge">npm install</span>, starts both servers, and opens <span class="link-badge">http://localhost:5173</span> in your default browser.</td>
      </tr>
      <tr>
        <td><strong>Step 3</strong></td>
        <td><strong>Clean Teardown</strong><br>Double-click <span class="code-badge">stop.bat</span> at any time to shut down.</td>
        <td>Gracefully terminates active background processes across ports 8000 and 5173 without leaving orphaned sockets.</td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-header">4. Security Operations Center (SOC) Access Credentials</h2>
  <table class="corporate-table">
    <thead>
      <tr>
        <th style="width: 28%;">Portal Interface</th>
        <th style="width: 24%;">Direct URL</th>
        <th style="width: 28%;">Access Credentials</th>
        <th style="width: 20%;">Security Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>NetGuard SOC Main Portal</strong></td>
        <td><a class="link-badge" href="http://localhost:5173" target="_blank">http://localhost:5173</a></td>
        <td>Username: <span class="code-badge">admin</span><br>Password: <span class="code-badge">admin123</span><br><em style="font-size:0.8rem; color:var(--slate-muted);">(Or click 'Admin (Full Access)' quick button)</em></td>
        <td>Lead SOC Analyst / Security Admin</td>
      </tr>
      <tr>
        <td><strong>FastAPI Interactive API Docs</strong></td>
        <td><a class="link-badge" href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a></td>
        <td>Open Access (Swagger UI)</td>
        <td>System Engineer / Backend Examiner</td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-header">5. College Viva / Demonstration Flow (7 Milestones)</h2>
  <p style="font-size: 0.9rem; margin-bottom: 8px;">Demonstrate the platform in this exact sequence during external examinations:</p>
  
  <table class="corporate-table">
    <thead>
      <tr>
        <th style="width: 10%;">Seq</th>
        <th style="width: 25%;">Demonstration Module</th>
        <th style="width: 20%;">Portal Route</th>
        <th style="width: 45%;">Key Viva Defense Talking Point</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>01</strong></td>
        <td><strong>SOC Executive Overview</strong></td>
        <td><span class="code-badge">/</span></td>
        <td>Demonstrate real-time traffic ingress rates, monitored host topology (Web Servers, API Gateways), and baseline model Macro-F1 benchmark (98.4%).</td>
      </tr>
      <tr>
        <td><strong>02</strong></td>
        <td><strong>Live Traffic Ingress Monitor</strong></td>
        <td><span class="code-badge">/live</span></td>
        <td>Select a model (Random Forest or PyTorch ANN) and click <strong>"START CAPTURE"</strong>. Show that ~85% of traffic is normal BENIGN (neutral dark slate with green badge), while ~15% of true intrusions (DoS Hulk, DDoS Flood, SSH-Patator) are flagged in red. Highlight the <strong>"TARGET APP / SERVICE"</strong> column (OpenSSH Port 22, HTTP Web Port 80, API Gateway Port 8080).</td>
      </tr>
      <tr>
        <td><strong>03</strong></td>
        <td><strong>Deep Forensic Inspector</strong></td>
        <td><span class="code-badge">Modal [INSPECT]</span></td>
        <td>Click <strong>"INSPECT"</strong> on any threat flow. Showcase the Affected Application & Security Impact Analysis card: displays affected daemon (<span class="code-badge">sshd.service</span>), blast radius, and tactical SOC mitigation recommendation.</td>
      </tr>
      <tr>
        <td><strong>04</strong></td>
        <td><strong>Class Imbalance Laboratory</strong></td>
        <td><span class="code-badge">/imbalance-analysis</span></td>
        <td>Explain the "Accuracy Paradox" in cybersecurity traffic. Demonstrate SMOTE synthetic boundary sampling and Cost-Sensitive Class Weighting to detect rare zero-day intrusions.</td>
      </tr>
      <tr>
        <td><strong>05</strong></td>
        <td><strong>Deep Learning Neural Lab</strong></td>
        <td><span class="code-badge">/deep-learning</span></td>
        <td>Walk through the PyTorch Multi-Layer Perceptron architecture (78 input features → 128 hidden → 64 hidden → Softmax) and loss convergence graphs.</td>
      </tr>
      <tr>
        <td><strong>06</strong></td>
        <td><strong>Multi-Model Benchmark</strong></td>
        <td><span class="code-badge">/comparison</span></td>
        <td>Present the comparative performance matrix contrasting Random Forest, XGBoost, and Deep Neural Networks across Macro-F1, Precision, and Recall.</td>
      </tr>
      <tr>
        <td><strong>07</strong></td>
        <td><strong>Official Audit & PDF Report</strong></td>
        <td><span class="code-badge">/reports</span></td>
        <td>Click <strong>"GENERATE AUDIT REPORT"</strong> to export official SOC forensic verification documentation in PDF and CSV format for evaluation submission.</td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-header">6. Viva Defense Oral Examination Reference (High-Impact Q&A)</h2>
  
  <div class="qa-card">
    <strong>Q1: Why was the CICIDS2017 benchmark dataset chosen for this research?</strong>
    <p>A: CICIDS2017 reflects realistic enterprise network traffic containing natural class distributions (over 85% Benign traffic and rare minority attack vectors like SSH-Patator, DoS Hulk, and PortScan). It extracts 78 comprehensive bidirectional flow statistics based on network 5-tuples.</p>
  </div>

  <div class="qa-card">
    <strong>Q2: Why is raw Classification Accuracy misleading for Intrusion Detection Systems?</strong>
    <p>A: In an imbalanced environment where 85% of traffic is Benign, a naive classifier that predicts 100% Benign achieves 85% raw accuracy while missing 100% of malicious intrusions. Therefore, Macro-F1 score, Precision-Recall AUC, and Minority Recall are the mathematically rigorous evaluation criteria.</p>
  </div>

  <div class="qa-card">
    <strong>Q3: How does network packet-to-flow aggregation function in practice?</strong>
    <p>A: Individual raw network packets are aggregated into bidirectional flows defined by their standard 5-tuple: (Source IP, Destination IP, Source Port, Destination Port, Protocol). Once a TCP FIN/RST termination flag or inactivity timeout occurs, the engine computes 78 statistical features (flow duration, inter-arrival time, packet length statistics) for ML inference.</p>
  </div>

  <div class="qa-card">
    <strong>Q4: How does SMOTE resolve the minority attack detection challenge?</strong>
    <p>A: Synthetic Minority Over-sampling Technique (SMOTE) overcomes simple random oversampling overfitting by generating synthetic feature vectors along the feature-space line segments connecting k-nearest minority neighbors, enabling classifiers to learn robust decision boundaries.</p>
  </div>

  <h2 class="section-header">7. Enterprise Operational Troubleshooting & Diagnostics</h2>
  <table class="corporate-table">
    <thead>
      <tr>
        <th style="width: 30%;">Operational Issue</th>
        <th style="width: 30%;">Probable Root Cause</th>
        <th style="width: 40%;">Rapid MNC Resolution Protocol</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Ports 8000 or 5173 Already Occupied</strong></td>
        <td>Previous development session or orphaned background processes holding socket binding.</td>
        <td>Double-click <span class="code-badge">stop.bat</span> in the project directory to terminate existing processes, then run <span class="code-badge">start.bat</span> again.</td>
      </tr>
      <tr>
        <td><strong>Python Not Recognized in CMD</strong></td>
        <td>Python was installed without registering executables in the Windows system environment PATH variable.</td>
        <td>Re-run the Python installer, select "Modify", check the box <strong>"Add Python to PATH"</strong>, and complete installation.</td>
      </tr>
      <tr>
        <td><strong>Browser Does Not Launch Automatically</strong></td>
        <td>Windows default browser association delayed or security prompt pending.</td>
        <td>Manually open Google Chrome, Microsoft Edge, or Firefox and navigate to <a class="link-badge" href="http://localhost:5173" target="_blank">http://localhost:5173</a>.</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    NetGuard Cybersecurity SOC &copy; 2026 | Enterprise Research & Academic Defense Documentation | Confidential
  </div>

</div>

</body>
</html>
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"HTML successfully generated at: {output_path}")

if __name__ == "__main__":
    docx_path = r"c:\Users\kavin\Desktop\Student_Project_Manual_MNC_Edition.docx"
    html_path = r"c:\Users\kavin\Desktop\Student_Project_Manual_MNC_Edition.html"
    build_docx(docx_path)
    build_html(html_path)

