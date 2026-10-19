import { z } from "zod";
import { tpoLeadSourceSchema } from "./tpo-crm-validation";
import { mapTpoImportHeaders, normalizeTpoImportHeader } from "./tpo-import-header-aliases";

export const TPO_LEAD_CSV_MAX_ROWS = 5000;
export const TPO_LEAD_CSV_MAX_CHARACTERS = 2_000_000;
export const TPO_LEAD_CSV_HEADERS = [
  "name", "email", "phone", "companyName", "designation", "source",
] as const;

export const confirmedTpoLeadImportSchema = z.object({
  confirmed: z.literal(true),
  csv: z.string().min(1).max(TPO_LEAD_CSV_MAX_CHARACTERS),
  skipRows:z.array(z.number().int().min(2).max(TPO_LEAD_CSV_MAX_ROWS+1)).max(TPO_LEAD_CSV_MAX_ROWS).optional(),
}).strict();

export const tpoLeadCsvRowSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.union([
    z.literal(""),
    z.string().trim().toLowerCase().email().max(150),
  ]),
  phone: z.union([
    z.literal(""),
    z.string().trim().max(30).regex(/^\+?[0-9() .-]+$/).refine(value => {
      const digits = normalizeTpoLeadImportPhone(value);
      return digits !== null && digits.length >= 8 && digits.length <= 10;
    }, "Enter a phone number"),
  ]),
  companyName: z.string().trim().max(150),
  designation: z.string().trim().max(100),
  source: z.union([z.literal(""), tpoLeadSourceSchema]),
}).strict().refine(row => Boolean(row.email || row.phone), {
  message: "An email address or phone number is required",
});

export type TpoLeadCsvRow = z.output<typeof tpoLeadCsvRowSchema>;

export type TpoLeadCsvPreviewRow = {
  row: number;
  name: string;
  lead: TpoLeadCsvRow | null;
  error: string | null;
};

export type TpoLeadImportRowResult = {
  row: number;
  status: "created" | "duplicate" | "invalid" | "skipped";
  reason: string | null;
  leadId: string | null;
};

export function normalizeTpoLeadImportPhone(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * A tiny strict RFC4180-compatible parser for the six-column import template:
 * quoted commas, escaped quotes, CRLF and quoted multiline fields are allowed.
 * Malformed quoting, extra columns, missing headings and oversized files fail
 * closed before any write. Row validation is independent, for an honest
 * per-row preview and partial import results.
 */
function parseCells(csv: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;
  let atFieldStart = true;
  const value = csv.replace(/^\uFEFF/, "");
  const commitField = () => {
    row.push(field);
    field = "";
    afterQuote = false;
    atFieldStart = true;
  };
  const commitRow = () => {
    commitField();
    if (row.some(cell => cell.trim() !== "")) records.push(row);
    row = [];
    if (records.length > TPO_LEAD_CSV_MAX_ROWS + 1) {
      throw new Error("CSV_ROW_LIMIT_EXCEEDED");
    }
  };
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quoted) {
      if (char === '"') {
        if (value[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      if (!atFieldStart || afterQuote) throw new Error("CSV_INVALID_QUOTES");
      quoted = true;
      atFieldStart = false;
      continue;
    }
    if (char === ",") {
      commitField();
      continue;
    }
    if (char === "\r" || char === "\n") {
      if (char === "\r" && value[i + 1] === "\n") i++;
      commitRow();
      continue;
    }
    if (afterQuote) throw new Error("CSV_INVALID_QUOTES");
    field += char;
    atFieldStart = false;
  }
  if (quoted) throw new Error("CSV_UNTERMINATED_QUOTE");
  if (row.length || field || afterQuote) commitRow();
  return records;
}

export function previewTpoLeadCsv(csv: string) {
  if (csv.length > TPO_LEAD_CSV_MAX_CHARACTERS) {
    throw new Error("CSV_SIZE_LIMIT_EXCEEDED");
  }
  const records = parseCells(csv);
  const header = records[0]?.map(value => value.trim().replace(/^\uFEFF/, ""));
  // Reuse the legacy import-with-preview HEADER_ALIASES shared with TPO
  // academic/results imports. Keep the existing foundThrough export spelling.
  // A company header maps to the recruiter-specific companyName field; this
  // parser never treats roll numbers or external references as lead IDs.
  const mapped=header?mapTpoImportHeaders(
    header,["name","email","phone","company","designation","source"],
  ):null;
  const normalized=header?.map((value,index)=>{
    const resolved=mapped?.fields[index];
    if(resolved==="company")return "companyName";
    if(resolved)return resolved;
    if(normalizeTpoImportHeader(value)==="foundthrough")return "source";
    return "";
  });
  if(mapped?.duplicates.length)throw new Error("CSV_HEADER_MISMATCH");
  if(!header||!normalized||TPO_LEAD_CSV_HEADERS.some(expected=>
   normalized.filter(actual=>actual===expected).length!==1)){
    throw new Error("CSV_HEADER_MISMATCH");
  }
  const column=(cells:string[],key:(typeof TPO_LEAD_CSV_HEADERS)[number])=>
   cells[normalized.indexOf(key)]??"";
  if (records.length <= 1) throw new Error("CSV_EMPTY");
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const rows: TpoLeadCsvPreviewRow[] = records.slice(1).map((cells, index) => {
    const row = index + 2;
    const name = column(cells,"name").trim();
    if (cells.length !== header.length) {
      return { row, name, lead: null, error: "The row has a different number of columns than the headings" };
    }
    const value = {
      name: column(cells,"name"),
      email: column(cells,"email").trim(),
      phone: column(cells,"phone").trim(),
      companyName: column(cells,"companyName"),
      designation: column(cells,"designation"),
      source: column(cells,"source")||"IMPORT",
    };
    const parsed = tpoLeadCsvRowSchema.safeParse(value);
    if (!parsed.success) {
      return {
        row, name, lead: null,
        error: parsed.error.issues.map(issue => issue.message).join("; ").slice(0, 300),
      };
    }
    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const normalizedPhone = normalizeTpoLeadImportPhone(parsed.data.phone);
    if ((normalizedEmail && seenEmails.has(normalizedEmail)) ||
        (normalizedPhone && seenPhones.has(normalizedPhone))) {
      return { row, name: parsed.data.name, lead: null, error: "Contact repeats an earlier valid row in this CSV" };
    }
    if (normalizedEmail) seenEmails.add(normalizedEmail);
    if (normalizedPhone) seenPhones.add(normalizedPhone);
    return { row, name: parsed.data.name, lead: parsed.data, error: null };
  });
  return {
    rows,
    ignoredHeaders:header.filter((_,index)=>!normalized[index]),
    total: rows.length,
    valid: rows.filter(row => row.lead !== null).length,
    invalid: rows.filter(row => row.lead === null).length,
  };
}

export function summarizeTpoLeadImport(rows: readonly TpoLeadImportRowResult[]) {
  return {
    total: rows.length,
    created: rows.filter(row => row.status === "created").length,
    duplicate: rows.filter(row => row.status === "duplicate").length,
    invalid: rows.filter(row => row.status === "invalid").length,
    skipped: rows.filter(row=>row.status==="skipped").length,
  };
}
