import { z } from "zod";
import { spreadsheetCsvCell } from "@/security/csv-cell";

export const departmentAttendanceExportQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
});

export type DepartmentAttendanceExportRow = {
  name: string;
  markedSessions: number;
  recordedRows: number;
  absent: number;
  late: number;
  excused: number;
  medical: number;
};

export function departmentAttendanceCsv(rows: readonly DepartmentAttendanceExportRow[]) {
  const headers = [
    "Department", "Marked Sessions", "Explicit Status Records",
    "Absent", "Late", "Excused", "Medical",
  ];
  const body = rows.map(row => [
    row.name, row.markedSessions, row.recordedRows, row.absent,
    row.late, row.excused, row.medical,
  ].map(value => spreadsheetCsvCell(value)).join(","));
  return "\ufeff" + [headers.map(attendanceCsvCell).join(","), ...body].join("\r\n") + "\r\n";
}

/** Detect observed count drift when a directory changes during a paginated export. */
export function assertDepartmentAttendanceExportPage(
  expected: {total: number; totalPages: number},
  actual: {total: number; totalPages: number},
) {
  if (actual.total !== expected.total || actual.totalPages !== expected.totalPages) {
    throw new Error("DEPARTMENT_ATTENDANCE_EXPORT_STALE");
  }
}

export function assertDepartmentAttendanceExportComplete(
  rows: readonly {id: string}[], total: number,
) {
  if (rows.length !== total || new Set(rows.map(row => row.id)).size !== rows.length) {
    throw new Error("DEPARTMENT_ATTENDANCE_EXPORT_STALE");
  }
}
