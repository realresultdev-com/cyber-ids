import os
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

class ReportService:
    @staticmethod
    def generate_pdf_report(
        output_path: Path,
        title: str,
        report_type: str,
        summary_stats: Dict[str, Any],
        eval_metrics: Dict[str, Any] = None,
        cm_data: List[List[int]] = None,
        classes: List[str] = None
    ) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc = SimpleDocTemplate(str(output_path), pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        styles = getSampleStyleSheet()

        # Custom Enterprise Cybersecurity styles
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6
        )
        sub_style = ParagraphStyle(
            'SubStyle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=14
        )
        sec_heading = ParagraphStyle(
            'SecHeading',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=12,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155')
        )

        # Header Title
        story.append(Paragraph(f"<b>{title}</b>", header_style))
        story.append(Paragraph(f"Enterprise Network Intrusion Detection & Research Audit &bull; Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} &bull; Classification: SEC-AUDIT-RESTRICTED", sub_style))
        story.append(Spacer(1, 10))

        # Section 1: Executive Summary & Overview
        story.append(Paragraph("1. System Overview & Summary Statistics", sec_heading))
        stats_table_data = [
            [Paragraph("<b>Metric Parameter</b>", body_style), Paragraph("<b>Value / Assessment</b>", body_style)]
        ]
        for k, v in summary_stats.items():
            stats_table_data.append([
                Paragraph(str(k), body_style),
                Paragraph(str(v), body_style)
            ])

        t_stats = Table(stats_table_data, colWidths=[200, 340])
        t_stats.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t_stats)
        story.append(Spacer(1, 14))

        # Section 2: Model Performance & Research Evaluation
        if eval_metrics:
            story.append(Paragraph("2. Model Evaluation & Imbalance Metrics", sec_heading))
            eval_rows = [
                [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Score</b>", body_style), Paragraph("<b>Research Significance</b>", body_style)],
                [Paragraph("Classification Accuracy", body_style), Paragraph(f"{eval_metrics.get('accuracy', 0.0):.4f}", body_style), Paragraph("Overall correct traffic classification rate", body_style)],
                [Paragraph("Macro Precision", body_style), Paragraph(f"{eval_metrics.get('precision_macro', 0.0):.4f}", body_style), Paragraph("Unweighted average across all classes (equal priority)", body_style)],
                [Paragraph("Macro Recall (Sensitivity)", body_style), Paragraph(f"{eval_metrics.get('recall_macro', 0.0):.4f}", body_style), Paragraph("Critical for detecting rare minority attack classes", body_style)],
                [Paragraph("Macro F1-Score", body_style), Paragraph(f"{eval_metrics.get('f1_macro', 0.0):.4f}", body_style), Paragraph("Harmonic mean of macro precision and recall", body_style)],
                [Paragraph("False Positive Rate (FPR)", body_style), Paragraph(f"{eval_metrics.get('false_positive_rate', 0.0):.4f}", body_style), Paragraph("Benign flows erroneously flagged as threats", body_style)],
                [Paragraph("False Negative Rate (FNR)", body_style), Paragraph(f"{eval_metrics.get('false_negative_rate', 0.0):.4f}", body_style), Paragraph("Attacks that slipped through undetected", body_style)],
                [Paragraph("Per-Flow Inference Time", body_style), Paragraph(f"{eval_metrics.get('inference_time_ms', 0.0):.3f} ms", body_style), Paragraph("Latency per network flow vector", body_style)],
            ]
            t_eval = Table(eval_rows, colWidths=[150, 90, 300])
            t_eval.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(t_eval)
            story.append(Spacer(1, 14))

        # Section 3: Confusion Matrix
        if cm_data and classes and len(classes) <= 10:
            story.append(Paragraph("3. Empirical Confusion Matrix", sec_heading))
            cm_table = [[Paragraph("<b>Actual \\ Pred</b>", body_style)] + [Paragraph(f"<b>{c}</b>", body_style) for c in classes]]
            for i, actual_cls in enumerate(classes):
                row = [Paragraph(f"<b>{actual_cls}</b>", body_style)]
                for val in cm_data[i]:
                    row.append(Paragraph(str(val), body_style))
                cm_table.append(row)

            col_w = min(60, int(460 / (len(classes) + 1)))
            t_cm = Table(cm_table, colWidths=[80] + [col_w]*len(classes))
            t_cm.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('PADDING', (0, 0), (-1, -1), 4),
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ]))
            story.append(t_cm)
            story.append(Spacer(1, 14))

        # Footer notes
        story.append(Paragraph("<b>Ethical & Academic Compliance Notice:</b> Evaluation conducted strictly within controlled sandbox environment. Network flow features parsed according to CICFlowMeter specifications with stratified splitting to ensure zero target-label or test data leakage.", sub_style))

        doc.build(story)
        return output_path

    @staticmethod
    def generate_csv_report(output_path: Path, headers: List[str], rows: List[List[Any]]) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)
        return output_path

