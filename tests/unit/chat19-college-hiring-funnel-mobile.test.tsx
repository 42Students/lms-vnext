import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {CollegeHiringFunnel} from "@/components/placements/college-hiring-funnel";

type Funnel=Parameters<typeof CollegeHiringFunnel>[0]["data"];
const totals={
 APPLIED:3,SHORTLISTED:2,ASSESSMENT:1,INTERVIEW:1,WAITLISTED:0,
 OFFERED:1,HIRED:1,REJECTED:0,WITHDRAWN:0,
};
function fixture(hasRows:boolean):Funnel{
 return {
  query:{},
  filters:{departments:[],programs:[],cohorts:[]},
  totalApplications:hasRows?9:0,
  averageHoursToShortlist:hasRows?5:null,
  totals:hasRows?totals:Object.fromEntries(Object.keys(totals).map(k=>[k,0])),
  companyRows:hasRows?[{
   jobId:"11111111-1111-4111-8111-111111111111",
   company:"IIT Dharwad partner",job:"Campus software role",
   total:9,byStage:totals,
  }]:[],
 } as unknown as Funnel;
}
describe("UX-SPILL-COL-FUNNEL-01: college hiring report phone and zero-state rendering",()=>{
 it("renders all ten stage metrics and names via shared responsive DataTable cards",()=>{
  const html=renderToStaticMarkup(<CollegeHiringFunnel data={fixture(true)}
   selectedSeasonId={null} selectedJobId={null}/>);
  expect(html).toContain('data-slot="data-table"');
  expect(html).toContain("Company-wise hiring report");
  expect(html).toContain("IIT Dharwad partner");
  expect(html).toContain("Campus software role");
  expect(html).toContain("More details");
  expect(html).toContain("All drives · Totals");
  for(const label of ["Company","Job","Total","Applied","Shortlisted","Assessment","Interview",
   "Waitlisted","Offered","Hired","Rejected","Withdrawn"]){
   expect(html).toContain(label);
  }
  expect(html).not.toContain("min-w-[72rem]");
  expect(html).toContain('href="/api/college/placements/hiring-analytics/export"');
 });
 it("an authorized empty portfolio has explicit no-data copy but no invented employer row",()=>{
  const html=renderToStaticMarkup(<CollegeHiringFunnel data={fixture(false)}
   selectedSeasonId={null} selectedJobId={null}/>);
  expect(html).toContain("No data for the selected filters");
  expect(html).not.toContain("IIT Dharwad partner");
  expect(html).not.toContain("All drives · Totals");
  expect(html).toContain("Clear filters");
 });
});
