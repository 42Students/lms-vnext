import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { ATTENDANCE_THRESHOLD } from "@/utils/attendanceConstants";

const COLORS = {
  primary: [15, 118, 110], // teal, matches the app's $primary
  textMuted: [100, 116, 139],
  present: [22, 101, 52],
  presentBg: [220, 252, 231],
  absent: [159, 18, 57],
  absentBg: [255, 228, 230],
  notMarked: [146, 64, 14],
  notMarkedBg: [254, 243, 199],
  none: [148, 163, 184],
  border: [226, 232, 240],
};

function statusFillAndText(status) {
  if (status === "P") return { fill: COLORS.presentBg, text: COLORS.present };
  if (status === "A") return { fill: COLORS.absentBg, text: COLORS.absent };
  if (status === "N") return { fill: COLORS.notMarkedBg, text: COLORS.notMarked };
  return { fill: [248, 250, 252], text: COLORS.none };
}

/**
 * Renders the report built by buildMonthlyAttendanceReport into a two-part PDF and triggers a
 * download: a portrait summary page (one row per student, easy to skim), followed by a landscape
 * day-by-day grid (every session's P/A/not-marked/no-class status) -- the same distinction the
 * on-screen legend already draws, just paginated for print instead of scrolled.
 */
export function downloadMonthlyAttendancePdf({ report, courseName, className }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // --- Page 1: title + summary ------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text("Monthly Attendance Report", margin, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textMuted);
  const subtitle = [courseName, className].filter(Boolean).join(" · ");
  doc.text(subtitle || "Course", margin, 70);
  doc.text(report.monthLabel, margin, 86);
  doc.text(`Generated ${report.generatedAt}`, pageWidth - margin, 86, { align: "right" });

  const belowThresholdCount = report.students.filter((s) => s.belowThreshold).length;
  const summaryCards = [
    { label: "Students", value: String(report.students.length) },
    { label: "Sessions held", value: String(report.totalSessions) },
    { label: "Overall attendance", value: report.overallPercent != null ? `${report.overallPercent}%` : "—" },
    { label: `Below ${ATTENDANCE_THRESHOLD}%`, value: String(belowThresholdCount) },
  ];
  const cardWidth = (pageWidth - margin * 2 - 24) / summaryCards.length;
  let cardX = margin;
  const cardY = 104;
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
    head: [["Student", "Present", "Absent", "Not marked", "Attendance %"]],
    body: report.students.map((s) => [
      s.name,
      String(s.present),
      String(s.absent),
      String(s.notMarked),
      s.percent != null ? `${s.percent}%` : "—",
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: [30, 41, 59] },
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const student = report.students[data.row.index];
      if (student?.belowThreshold && data.column.index === 4) {
        data.cell.styles.textColor = COLORS.absent;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // --- Page 2: day-by-day grid (landscape) --------------------------------------------------
  doc.addPage("a4", "landscape");
  const wideWidth = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(`Day-by-day — ${report.monthLabel}`, margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("P = Present   A = Absent   — = Not marked yet   × = No class", margin, 56);

  autoTable(doc, {
    startY: 70,
    margin: { left: margin, right: margin },
    head: [["Student", ...report.dates.map((d) => `${d.day}\n${d.weekday[0]}`)]],
    body: report.students.map((s) => [
      s.name,
      ...s.daily.map((d) => (d.status === "X" ? "×" : d.status === "N" ? "—" : d.status)),
    ]),
    styles: { fontSize: 7, cellPadding: 3, halign: "center", valign: "middle" },
    columnStyles: { 0: { halign: "left", cellWidth: 90, fontStyle: "bold" } },
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 7 },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index === 0) return;
      const dayIndex = data.column.index - 1;
      const status = report.students[data.row.index]?.daily?.[dayIndex]?.status;
      const { fill, text } = statusFillAndText(status);
      data.cell.styles.fillColor = fill;
      data.cell.styles.textColor = text;
    },
    didDrawPage: () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`Generated ${report.generatedAt}`, wideWidth - margin, doc.internal.pageSize.getHeight() - 16, {
        align: "right",
      });
    },
  });

  const safeCourse = (courseName || "course").replace(/[^a-z0-9]+/gi, "-");
  const safeMonth = report.monthLabel.replace(/\s+/g, "-");
  doc.save(`attendance-${safeCourse}-${safeMonth}.pdf`);
}
