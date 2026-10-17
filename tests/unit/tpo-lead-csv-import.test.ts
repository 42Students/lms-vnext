import { describe, expect, it } from "vitest";
import {
  confirmedTpoLeadImportSchema,
  normalizeTpoLeadImportPhone,
  previewTpoLeadCsv,
  summarizeTpoLeadImport,
  TPO_LEAD_CSV_MAX_ROWS,
} from "@/modules/placements/tpo-lead-csv-import-model";

const headings = "name,email,phone,companyName,designation,source\r\n";

describe("DB09 TPO recruiter CSV import", () => {
  it("previews escaped quotes, commas, newlines and normalized source/email", () => {
    const preview = previewTpoLeadCsv("\uFEFF" + headings +
      '"A ""Recruiter"", Jane", Jane@Example.Org ,,"Mega, Inc","HR\nAPAC",LinkedIn\r\n');
    expect(preview).toMatchObject({ total: 1, valid: 1, invalid: 0 });
    expect(preview.rows[0]?.lead).toMatchObject({
      name: 'A "Recruiter", Jane',
      email: "jane@example.org",
      companyName: "Mega, Inc",
      designation: "HR\nAPAC",
      source: "LINKEDIN",
    });
  });

  it("includes invalid rows in preview without inventing a valid contact", () => {
    const preview = previewTpoLeadCsv(headings +
      "Good,GOOD@example.org,,Acme,,ALUMNI\n" +
      "No Email,,,,,\n" +
      "Phone,,+91 98765 43210,Acme,,\n" +
      "Bad extra,a@example.org,,,COLD_OUTREACH,EXTRA,EXTRA\n");
    expect(preview.total).toBe(4);
    expect(preview.valid).toBe(2);
    expect(preview.invalid).toBe(2);
    expect(preview.rows[1]?.lead).toBeNull();
    expect(preview.rows[3]?.error).toContain("different number of columns");
    expect(normalizeTpoLeadImportPhone("+91 98765 43210")).toBe("9876543210");
  });

  it("fails closed for wrong headers, malformed quoting, empty or oversized imports", () => {
    expect(() => previewTpoLeadCsv("name,email\nA,a@example.org")).toThrow("CSV_HEADER_MISMATCH");
    expect(() => previewTpoLeadCsv(headings + '"Unclosed,a@example.org')).toThrow("CSV_UNTERMINATED_QUOTE");
    expect(() => previewTpoLeadCsv(headings + 'Broken"quote,a@example.org,,,,' )).toThrow("CSV_INVALID_QUOTES");
    expect(() => previewTpoLeadCsv(headings)).toThrow("CSV_EMPTY");
    const row = "Name,one@example.org,,,,\n";
    expect(() => previewTpoLeadCsv(headings + row.repeat(TPO_LEAD_CSV_MAX_ROWS + 1)))
      .toThrow("CSV_ROW_LIMIT_EXCEEDED");
  });

  it("requires explicit confirmation and rejects hidden or overlong payloads", () => {
    const csv = headings + "A,a@example.org,,,,";
    expect(confirmedTpoLeadImportSchema.parse({ confirmed: true, csv })).toEqual({ confirmed: true, csv });
    for (const value of [
      { confirmed: false, csv },
      { confirmed: true, csv, collegeId: "spoof" },
      { confirmed: true, csv: "" },
      { confirmed: true, csv: "x".repeat(2000001) },
    ]) {
      expect(confirmedTpoLeadImportSchema.safeParse(value).success).toBe(false);
    }
  });

  it("summarizes durable outcomes without miscounting rejected records", () => {
    expect(summarizeTpoLeadImport([
      { row: 2, status: "created", reason: null, leadId: "one" },
      { row: 3, status: "duplicate", reason: "Existing", leadId: null },
      { row: 4, status: "invalid", reason: "Invalid", leadId: null },
    ])).toEqual({ total: 3, created: 1, duplicate: 1, invalid: 1, skipped: 0 });
  });
});
