import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import dayjs from "dayjs";

// Same palette as downloadMonthlyAttendancePdf.js (#12) -- one look for every PDF this app
// generates, not a fresh one per report.
const COLORS = {
  primary: [15, 118, 110],
  textMuted: [100, 116, 139],
  good: [22, 101, 52],
  goodBg: [220, 252, 231],
  bad: [159, 18, 57],
  badBg: [255, 228, 230],
  border: [226, 232, 240],
};

function accuracyTone(percent) {
  if (percent == null) return { fill: [248, 250, 252], text: COLORS.textMuted };
  if (percent < 60) return { fill: COLORS.badBg, text: COLORS.bad };
  return { fill: COLORS.goodBg, text: COLORS.good };
}

/**
 * Renders a quiz report (buildQuizReport output) to a PDF and triggers a download: a summary of
 * completion/average/distribution, the full question-accuracy breakdown, then the per-student
 * score table. Mirrors downloadMonthlyAttendancePdf.js's structure and styling conventions.
 */
export function downloadQuizReportPdf({ report, courseName, className, incompleteNote }) {
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
  doc.text(subtitle || "Quiz report", margin, 70);
  doc.text(`Generated ${report.generatedAt}`, pageWidth - margin, 70, { align: "right" });
  // Faculty audit F-054/F-091: a report built from incomplete data says so on the document itself, above the title.
  if (incompleteNote) {
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
    { label: "Questions", value: String(report.questionCount) },
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.text("Question accuracy", margin, cardY + 88);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Worst-answered first", margin, cardY + 102);

  autoTable(doc, {
    startY: cardY + 114,
    margin: { left: margin, right: margin },
    head: [["#", "Question", "Correct", "Accuracy"]],
    body: report.questions.map((q, i) => [
      String(i + 1),
      q.prompt,
      `${q.correctCount}/${q.answeredCount}`,
      q.accuracyPercent != null ? `${q.accuracyPercent}%` : "Not answered yet",
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: [30, 41, 59] },
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: "auto" }, 2: { cellWidth: 56 }, 3: { cellWidth: 90 } },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 3) return;
      const { text } = accuracyTone(report.questions[data.row.index]?.accuracyPercent);
      data.cell.styles.textColor = text;
      data.cell.styles.fontStyle = "bold";
    },
  });

  doc.addPage("a4", "portrait");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text("Student scores", margin, 40);

  autoTable(doc, {
    startY: 56,
    margin: { left: margin, right: margin },
    head: [["Student", "Score", "Percent"]],
    body: report.students.map((s) => [
      s.name,
      s.percent != null ? `${s.score}/${s.maxScore}` : "Not scored",
      s.percent != null ? `${s.percent}%` : "—",
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: [30, 41, 59] },
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 2) return;
      const student = report.students[data.row.index];
      if (student?.percent != null && student.percent < 60) {
        data.cell.styles.textColor = COLORS.bad;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const safeTitle = (report.title || "quiz").replace(/[^a-z0-9]+/gi, "-");
  doc.save(`quiz-report-${safeTitle}.pdf`);
}
