import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import dayjs from "dayjs";

// Same palette as downloadMonthlyAttendancePdf.js / downloadQuizReportPdf.js.
const COLORS = {
  primary: [15, 118, 110],
  textMuted: [100, 116, 139],
  good: [22, 101, 52],
  bad: [159, 18, 57],
  border: [226, 232, 240],
};

/**
 * Renders an assignment report (buildAssignmentReport output) to a PDF: summary, then the
 * per-student score/timing table, then (if any) the list of enrolled students who never
 * submitted. Mirrors downloadQuizReportPdf.js's structure and styling.
 */
export function downloadAssignmentReportPdf({ report, courseName, className, incompleteNote }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text(report.title, margin, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textMuted);
  // Due date was on the on-screen report (ReportSummaryHeader) but missing here -- a PDF a
  // faculty member downloads to file away or print is exactly where that context matters most.
  const dueDateLabel = report.dueDate ? `Due ${dayjs(report.dueDate).format("MMM D, YYYY")}` : null;
  const subtitle = [courseName, className, dueDateLabel].filter(Boolean).join(" · ");
  doc.text(subtitle || "Assignment report", margin, 70);
  doc.text(`Generated ${report.generatedAt}`, pageWidth - margin, 70, { align: "right" });
  // Faculty audit F-054/F-091: a report built from incomplete data says so on the document itself.
  if (incompleteNote) {
    // Above the title, where nothing else is drawn.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text(doc.splitTextToSize(`INCOMPLETE DATA: ${incompleteNote}`, pageWidth - margin * 2).slice(0, 2), margin, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.textMuted);
  }

  const summaryCards = [
    { label: "Submitted", value: report.rosterSize ? `${report.submittedCount}/${report.rosterSize}` : String(report.submittedCount) },
    { label: "Average score", value: report.avgPercent != null ? `${report.avgPercent}%` : "—" },
    { label: "On time / Late", value: `${report.onTimeCount} / ${report.lateCount}` },
    { label: "Total points", value: String(report.totalPoints) },
  ];
  const cardWidth = (pageWidth - margin * 2 - 24) / summaryCards.length;
  let cardX = margin;
  const cardY = 96;
  summaryCards.forEach((card) => {
    doc.setDrawColor(...COLORS.border);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, cardY, cardWidth, 52, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.primary);
    doc.text(card.value, cardX + 12, cardY + 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(card.label, cardX + 12, cardY + 40);
    cardX += cardWidth + 8;
  });

  autoTable(doc, {
    startY: cardY + 72,
    margin: { left: margin, right: margin },
    head: [["Student", "Score", "Percent", "Submitted"]],
    body: report.students.map((s) => [
      s.name,
      s.graded ? `${s.score}/${s.maxScore}` : "Not graded",
      s.percent != null ? `${s.percent}%` : "—",
      s.submittedAt ? `${new Date(s.submittedAt).toLocaleDateString()}${s.isLate ? " (late)" : ""}` : "—",
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: [30, 41, 59] },
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const student = report.students[data.row.index];
      if (data.column.index === 2 && student?.percent != null && student.percent < 60) {
        data.cell.styles.textColor = COLORS.bad;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 3 && student?.isLate) {
        data.cell.styles.textColor = COLORS.bad;
      }
    },
  });

  if (report.notSubmitted.length > 0) {
    const afterTableY = doc.lastAutoTable.finalY + 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Not submitted (${report.notSubmitted.length})`, margin, afterTableY);

    autoTable(doc, {
      startY: afterTableY + 10,
      margin: { left: margin, right: margin },
      head: [["Student"]],
      body: report.notSubmitted.map((s) => [s.name]),
      styles: { fontSize: 9, cellPadding: 6, textColor: COLORS.bad },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  const safeTitle = (report.title || "assignment").replace(/[^a-z0-9]+/gi, "-");
  doc.save(`assignment-report-${safeTitle}.pdf`);
}
