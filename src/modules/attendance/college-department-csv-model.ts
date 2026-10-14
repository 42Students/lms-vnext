import { z } from "zod";
import { attendanceCsvCell } from "./admin-grid-model";

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
  ].map(value => attendanceCsvCell(value)).join(","));
  return "\ufeff" + [headers.map(attendanceCsvCell).join(","), ...body].join("\r\n") + "\r\n";
}
