import { describe, expect, it } from "vitest";
import { projectTemplateCatalogueCsv } from "@/modules/projects/project-template-catalogue-model";
import { projectReadinessOverrideCsvCell } from "@/modules/projects/readiness-overrides-export-model";
import { exportClassTeamsCsv } from "@/modules/projects/class-team-csv-export";

// A spreadsheet may strip Unicode directional controls before parsing the
// cell. Prefix any formula-like cell with an apostrophe *inside* its CSV quotes.
const disguisedFormulas = [
  "\u2066=1+1", // left-to-right isolate
  "\u2067+2+2", // right-to-left isolate
  "\u2068@HYPERLINK(1)", // first strong isolate
  "\u2069-2+3", // pop directional isolate
  "\u200b\t=1+1",
  " \u202e+2+3",
] as const;
const templateId = "00000000-0000-4000-8000-000000000001";
const sections = { overview: 0, releases: 0, sprints: 0, tasks: 0, resources: 0 };

describe("IIT Dharwad Projects: adversarial spreadsheet export", () => {
  it("PROJ-BREAK-exports-06 isolates cannot disguise formula cells in template exports", () => {
    for (const title of disguisedFormulas) {
      const csv = projectTemplateCatalogueCsv([{ templateId, title, version: 1, sections }]);
      expect(csv).toContain(`"'${title}"`);
      expect(csv).not.toContain(`"${title}"`);
      expect(csv.startsWith('\uFEFF"Title","Version",')).toBe(true);
    }
  });

  it("PROJ-BREAK-exports-07 the same protection applies to readiness override exports", () => {
    for (const value of disguisedFormulas) {
      expect(projectReadinessOverrideCsvCell(value)).toBe(`"'${value}"`);
    }
    expect(projectReadinessOverrideCsvCell('Safe, "quoted" value')).toBe('"Safe, ""quoted"" value"');
  });

  it("PROJ-BREAK-exports-08 team roster names and roll numbers cannot bypass isolation guards", () => {
    for (const value of disguisedFormulas) {
      const csv = exportClassTeamsCsv(
        [{ name: value, membershipIds: [templateId] }],
        new Map([[templateId, value]]),
      );
      expect(csv).toContain(`"'${value}","${templateId}","'${value}"`);
    }
  });

  it("PROJ-BREAK-exports-09 normal prose retains its value without spurious apostrophes", () => {
    for (const value of ["IIT Dharwad", "A, B", 'Say "yes"', "New\nline"]) {
      const csv = projectReadinessOverrideCsvCell(value);
      expect(csv).toBe('"' + value.replace(/"/g, '""') + '"');
    }
  });
});
