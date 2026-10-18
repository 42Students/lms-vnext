import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("UX-UNOWNED-TABLE-04 Super Admin interview operations",()=>{
  it("retains all eleven headers and the CSV/ICS export actions after responsive table migration",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/components/admin/super-admin-interview-operations.tsx"),"utf8");
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain('import { DataTable } from "@/components/ui/data-table"');
    expect(source).toContain("<DataTable<SuperAdminCalendarRound>");
    expect(source).toContain('caption="Candidate interview bookings"');
    for(const header of ["Candidate","Department","Round","Company",
      "Date (IST)","Type","Mode","Interviewer","Status","Venue","Actions"])
      expect(source).toContain('header:"'+header+'"');
    expect(source).toContain('mobilePriority:"primary"');
    expect(source).toContain('mobilePriority:"action"');
    expect(source).toContain('collegeInterviewIcs');
    expect(source).toContain('download={"interview-"+row.id+".ics"}');
    expect(source).toContain('download="interviews.csv"');
    expect(source).toContain("Export includes the first 500 visible rounds");
    expect(source).toContain("Possible conflicts only");
    expect(source).toContain('truncated?" First 2,000 bookings shown');
    expect(source).not.toMatch(/<\s*table\b/i);
    expect(source).not.toMatch(/<\s*(thead|tbody|tr|td)\b/i);
  });

  it("retains IST formatting and permission-preserving schedule destination",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/components/admin/super-admin-interview-operations.tsx"),"utf8");
    expect(source).toContain('timeZone:"Asia/Kolkata"');
    expect(source).toContain('href={"/admin/placements/jobs/"+encodeURIComponent(row.jobId)+"/schedule"}');
    expect(source).toContain('conflicts.get(row.id)?.join("; ")');
    expect(source).toContain('title:row.title,date:row.startsAt');
  });
});
