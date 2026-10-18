import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { recurringSlotTimeIst } from "@/components/academics/college-recurring-preview";

describe("UX-UNOWNED-TABLE-01 College Admin recurring sessions preview", () => {
  it("renders schedule time consistently in IST, independent of machine timezone",()=>{
    const slot={startsAt:"2026-10-18T04:00:00.000Z",endsAt:"2026-10-18T05:30:00.000Z"};
    const format = new Intl.DateTimeFormat("en-IN",{
      timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",
    });
    expect(recurringSlotTimeIst(slot)).toBe(
      format.format(new Date(slot.startsAt))+" – "+format.format(new Date(slot.endsAt)),
    );
    const utcOnly=format.format(new Date("2026-10-18T04:00:00Z"));
    expect(utcOnly).toMatch(/09:30/);
  });

  it("retains date, time, conflicts, empty state, and confirmation in shared responsive DataTable",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/components/academics/college-recurring-preview.tsx"),"utf8");
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain('import { DataTable } from "@/components/ui/data-table"');
    expect(source).toContain('<DataTable<Result["slots"][number]>');
    expect(source).toContain('caption="Recurring sessions preview"');
    expect(source).toContain('header:"Date (IST)"');
    expect(source).toContain('header:"Time (IST)"');
    expect(source).toContain('header:"Conflicts"');
    expect(source).toContain('cell:recurringSlotTimeIst');
    expect(source).toContain('"None detected"');
    expect(source).toContain("No selected weekdays match this date range.");
    expect(source).toContain("Create recurring sessions?");
    expect(source).not.toMatch(/<\s*table\b/i);
    expect(source).not.toMatch(/<\s*(thead|tbody|tr|td)\b/i);
  });
});
