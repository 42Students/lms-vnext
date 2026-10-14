/** Dependency-free, multi-page PDF export for authorized Faculty assessment reports.
 * The caller must scope every row to the authorized Section before passing it here.
 */
export type FacultyReportPdfInput = {
  kind: "assignment" | "quiz" | "attendance";
  title: string;
  subtitle: string;
  summary: readonly string[];
  sections: readonly { title: string; rows: readonly string[] }[];
  generatedAt?: Date;
};

const PAGE_HEIGHT = 842;
const MAX_LINE_LENGTH = 88;
const MAX_LINES_PER_PAGE = 56;

function printable(value: string) {
  return value.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(value: string) {
  const lines: string[] = [];
  let remaining = printable(value);
  if (!remaining) return [""];
  while (remaining.length > MAX_LINE_LENGTH) {
    let width = remaining.lastIndexOf(" ", MAX_LINE_LENGTH);
    if (width < MAX_LINE_LENGTH / 2) width = MAX_LINE_LENGTH;
    lines.push(remaining.slice(0, width));
    remaining = remaining.slice(width).trimStart();
  }
  lines.push(remaining);
  return lines;
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** A valid PDF/1.4 document; generated on click without a third-party service. */
export function buildFacultyReportPdf(input: FacultyReportPdfInput): string {
  const pages: string[][] = [[]];
  const addLine = (line: string) => {
    if (pages[pages.length - 1]!.length >= MAX_LINES_PER_PAGE) pages.push([]);
    pages[pages.length - 1]!.push(line);
  };
  const addBlock = (value: string) => wrap(value).forEach(addLine);
  addBlock("FACULTY " + input.kind.toUpperCase() + " REPORT");
  addBlock(input.title);
  addBlock(input.subtitle);
  addBlock("Generated " + (input.generatedAt ?? new Date()).toISOString().slice(0, 16).replace("T", " ") + " UTC");
  addLine("-");
  for (const summary of input.summary) addBlock(summary);
  for (const section of input.sections) {
    addLine("");
    addBlock(section.title.toUpperCase());
    addLine("-");
    if (section.rows.length === 0) addLine("No records");
    else for (const row of section.rows) addBlock(row);
  }

  // Keep the complete byte stream ASCII so that cross-reference byte offsets
  // exactly match string offsets. Courier is a standard embedded-viewer font.
  const objects: string[] = [];
  const reserve = () => { objects.push(""); return objects.length; };
  const set = (id: number, object: string) => { objects[id - 1] = object; };
  const catalogId = reserve();
  const pagesId = reserve();
  const fontId = reserve();
  set(fontId, "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  const pageIds: number[] = [];
  pages.forEach((lines, pageIndex) => {
    const stream = [
      ...lines.map((line, index) =>
        "BT /F1 9 Tf 42 " + (PAGE_HEIGHT - 48 - index * 12) +
        " Td (" + pdfEscape(line) + ") Tj ET"),
      "BT /F1 8 Tf 42 35 Td (Page " + (pageIndex + 1) + " of " + pages.length + ") Tj ET",
    ].join("\n") + "\n";
    const contentId = reserve();
    set(contentId, "<< /Length " + stream.length + " >>\nstream\n" + stream + "endstream");
    const pageId = reserve();
    set(pageId, "<< /Type /Page /Parent " + pagesId +
      " 0 R /MediaBox [0 0 595 " + PAGE_HEIGHT + "] /Resources << /Font << /F1 " +
      fontId + " 0 R >> >> /Contents " + contentId + " 0 R >>");
    pageIds.push(pageId);
  });
  set(pagesId, "<< /Type /Pages /Kids [" + pageIds.map((id) => id + " 0 R").join(" ") + "] /Count " + pageIds.length + " >>");
  set(catalogId, "<< /Type /Catalog /Pages " + pagesId + " 0 R >>");
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += (index + 1) + " 0 obj\n" + object + "\nendobj\n";
  });
  const xref = pdf.length;
  pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += String(offset).padStart(10, "0") + " 00000 n \n";
  }
  pdf += "trailer\n<< /Size " + (objects.length + 1) + " /Root " +
    catalogId + " 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return pdf;
}
