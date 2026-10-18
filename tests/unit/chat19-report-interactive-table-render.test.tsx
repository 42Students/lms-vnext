import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {ReportInteractiveTable} from "@/components/placements/report-interactive-table";

describe("UX-SPILL-HR-02: responsive interactive report card and export controls",()=>{
 it("renders complete report fields as DataTable phone cards, not a raw wide custom table",()=>{
  const html=renderToStaticMarkup(<ReportInteractiveTable
   title="Employer hiring report"
   headings={["Candidate","Score","Round","College","Offer"]}
   rows={[
    ["Learner <script>alert(1)</script>",95,"Interview","IIT Dharwad","Pending"],
    ["Another learner",0,"Screening","Other campus","Accepted"],
   ]}
   emptyDescription="No authorized applicants."
  />);
  expect(html).toContain('data-slot="data-table"');
  expect(html).toContain("Employer hiring report");
  expect(html).toContain("IIT Dharwad");
  expect(html).toContain("Accepted");
  expect(html).toContain("More details");
  expect(html).toContain("Sort rows by");
  expect(html).toContain('aria-label="Reverse sort direction"');
  expect(html).toContain("Export shown CSV");
  expect(html).toContain("Copy shown");
  expect(html).toContain("Close filters");
  expect(html).toContain("Column filters (0)");
  expect(html).toMatch(/<summary[^>]*min-h-11[^>]*>Column filters/);
  expect(html).toMatch(/<summary[^>]*focus-visible:outline-2[^>]*>Columns<\/summary>/);
  expect(html).toContain("Close columns");
  expect(html).toContain("bottom-0");
  expect(html).toContain("max-h-[70dvh]");
  expect(html).toContain("Sort Candidate");
  expect(html).toContain('aria-pressed="false"');
  expect(html).toContain("Learner &lt;script&gt;alert(1)&lt;/script&gt;");
  expect(html).not.toContain("<script>alert(1)</script>");
  expect(html).not.toContain("min-w-max");
 });
 it("does not confuse an actually empty authorized report with a loading screen",()=>{
  const html=renderToStaticMarkup(<ReportInteractiveTable
   title="Assigned college totals"
   headings={["College","Total"]}
   rows={[]}
   emptyDescription="No campus totals in this authorized view."
  />);
  expect(html).toContain("No campus totals in this authorized view.");
  expect(html).not.toContain("Loading");
  expect(html).not.toContain("Export shown CSV");
 });
 it("keeps each visible report control at least 44px tall",()=>{
  const html=renderToStaticMarkup(<ReportInteractiveTable
   title="Recruiter report"
   headings={["Role","Total"]}
   rows={[["Software Engineer",5]]}
   emptyDescription="No rows"
  />);
  expect(html).toContain("min-h-11");
  expect(html).not.toContain("min-h-10");
 });
});
