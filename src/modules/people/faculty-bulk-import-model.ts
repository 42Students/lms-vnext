import { z } from "zod";
import { parseTpoImportCsvRecords } from "@/modules/placements/tpo-import-csv-parser";

export const facultyBulkRowSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  phoneE164: z.string().regex(/^\+91[6-9][0-9]{9}$/),
  email: z.email().optional(),
}).strict();
export type FacultyBulkRow = z.infer<typeof facultyBulkRowSchema>;

export function parseFacultyBulkCsv(source: string): FacultyBulkRow[] {
  const rows = parseTpoImportCsvRecords(source, 501);
  if (!rows.length) throw new Error("Choose a CSV file with faculty records.");
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
  const names = rows[0].map(norm);
  const lookup = (aliases: string[]) => names.findIndex(v => aliases.includes(v));
  const mapping = {
    firstName: lookup(["firstname", "first", "givenname"]),
    lastName: lookup(["lastname", "last", "surname"]),
    phone: lookup(["mobile", "mobilenumber", "phone", "phonenumber"]),
    email: lookup(["email", "emailaddress"]),
  };
  const header = mapping.firstName >= 0 && mapping.phone >= 0;
  const start = header ? 1 : 0;
  const result = rows.slice(start).map((row, i) => {
    const firstName = (row[header ? mapping.firstName : 0] ?? "").trim();
    const lastName = (row[header ? mapping.lastName : 1] ?? "").trim();
    const phone = (row[header ? mapping.phone : 2] ?? "").replace(/[\s()+-]/g, "");
    const phoneE164 = "+91" + (phone.startsWith("91") && phone.length === 12 ? phone.slice(2) : phone);
    const email = (row[header ? mapping.email : 3] ?? "").trim();
    const parsed = facultyBulkRowSchema.safeParse({firstName,lastName,phoneE164,
      ...(email ? {email} : {})});
    if (!parsed.success) throw new Error("Invalid faculty details at CSV row " + (i+start+1));
    return parsed.data;
  });
  if (!result.length) throw new Error("No faculty records were found.");
  if (result.length > 500) throw new Error("The maximum batch size is 500 faculty.");
  return result;
}
