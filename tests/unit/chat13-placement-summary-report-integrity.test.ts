import {describe,expect,it} from "vitest";
import {
 countsAsPlacedByCollegeRule,summarizePlacementReports,summarizePlacementReportDetails,
 placementReportCsvCell,placementReportCsv,
 type PlacementReportFacts,type PlacementReportDetailedOffer,
} from "@/modules/placements/report-model";
const jobs=[
 {id:"j1",title:"Engineer",companyId:"c1",companyName:"Acme",employmentType:"FULL_TIME"},
 {id:"j2",title:"Intern",companyId:"c2",companyName:"Beta",employmentType:"INTERNSHIP"},
];
const offers:PlacementReportDetailedOffer[]=[
 {id:"o1",jobId:"j1",jobTitle:"Engineer",companyId:"c1",companyName:"Acme",
  membershipId:"m1",employmentType:"FULL_TIME",status:"ACCEPTED",
  annualCtcInr:1000000,expiresAt:null,joiningStatus:"JOINED"},
 {id:"o2",jobId:"j1",jobTitle:"Engineer",companyId:"c1",companyName:"Acme",
  membershipId:"m2",employmentType:"FULL_TIME",status:"ISSUED",
  annualCtcInr:500000,expiresAt:"2026-10-17T00:00:00Z",joiningStatus:null},
 {id:"o3",jobId:"j2",jobTitle:"Intern",companyId:"c2",companyName:"Beta",
  membershipId:"m4",employmentType:"INTERNSHIP",status:"ACCEPTED",
  annualCtcInr:4000000,expiresAt:null,joiningStatus:null},
 {id:"o4",jobId:"j1",jobTitle:"Engineer",companyId:"c1",companyName:"Acme",
  membershipId:"m3",employmentType:"FULL_TIME",status:"ACCEPTED",
  annualCtcInr:null,expiresAt:null,joiningStatus:null},
];
describe("chat-13 Super Admin placement report fraud, counting and CSV integrity",()=>{
 it("SA-REPORT-METRICS-01 counts only permitted milestones and full-time offers",()=>{
  const policy=(offerStatus:string,countsAsPlacedAt:"SELECTED"|"OFFER_RELEASED"|"OFFER_ACCEPTED",employmentType="FULL_TIME",offerKind="OFFER",selectedOutcome=false)=>
   countsAsPlacedByCollegeRule({offerStatus,countsAsPlacedAt,employmentType,offerKind,selectedOutcome});
  expect(policy("ACCEPTED","OFFER_ACCEPTED")).toBe(true);
  expect(policy("ISSUED","OFFER_ACCEPTED")).toBe(false);
  expect(policy("ISSUED","OFFER_RELEASED")).toBe(true);
  expect(policy("WITHDRAWN","OFFER_RELEASED")).toBe(false);
  expect(policy("ACCEPTED","OFFER_ACCEPTED","INTERNSHIP")).toBe(false);
  expect(policy("ACCEPTED","OFFER_ACCEPTED","FULL_TIME","LETTER")).toBe(false);
  expect(policy("REJECTED","SELECTED","FULL_TIME","OFFER",true)).toBe(true);
  expect(policy("ACCEPTED","SELECTED","FULL_TIME","OFFER",false)).toBe(false);
 });
 it("SA-REPORT-METRICS-02 ignores duplicates, nonselected jobs and multiple offers per learner",()=>{
  const facts:PlacementReportFacts={
   jobs,
   registrations:[{membershipId:"m1"},{membershipId:"m2"},{membershipId:"m3"},{membershipId:"m4"},{membershipId:"m1"}],
   applications:[
    {id:"a1",jobId:"j1",membershipId:"m1",status:"SUBMITTED",screeningStatus:"SHORTLISTED"},
    {id:"a1",jobId:"j1",membershipId:"m1",status:"SUBMITTED",screeningStatus:"SHORTLISTED"},
    {id:"a2",jobId:"j1",membershipId:"m2",status:"SUBMITTED",screeningStatus:null},
    {id:"foreign-app",jobId:"not-selected",membershipId:"x",status:"SUBMITTED",screeningStatus:null},
   ],
   offers:[...offers.map(o=>({id:o.id,jobId:o.jobId,membershipId:o.membershipId,status:o.status,
     annualCtcInr:o.annualCtcInr,joiningStatus:o.joiningStatus})),
    {id:"o1",jobId:"j1",membershipId:"m1",status:"ACCEPTED",annualCtcInr:1000000,joiningStatus:"JOINED"},
    {id:"rogue-offer",jobId:"unselected",membershipId:"x",status:"ACCEPTED",annualCtcInr:99999999,joiningStatus:null},
   ],
   branches:[],
  };
  const result=summarizePlacementReports(facts).metrics;
  expect(result.drives).toBe(2);
  expect(result.registered).toBe(4);
  expect(result.applicants).toBe(2);
  expect(result.applications).toBe(2);
  expect(result.offers).toBe(4);
  expect(result.acceptedOffers).toBe(3);
  expect(result.studentsPlaced).toBe(2);
  expect(result.averagePackageInr).toBe(1000000);
  expect(result.highestPackageInr).toBe(1000000);
 });
 it("SA-REPORT-DETAILS-01 reports accepted versus expired outstanding exactly, no joining inference",()=>{
  const registeredLearners=["m1","m2","m3","m4"].map(id=>({
    membershipId:id,displayName:id,departmentId:null,departmentName:"Unassigned",
  }));
  expect(()=>summarizePlacementReportDetails({registeredLearners,offers,asOf:"yesterday"})).toThrow();
  const detail=summarizePlacementReportDetails({registeredLearners,offers:offers.concat(offers[0]!),asOf:"2026-10-18T12:00:00Z"});
  expect(detail.unplaced.map(r=>r.membershipId)).toEqual(["m2","m4"]);
  expect(detail.ctc).toMatchObject({acceptedFullTimeOffers:2,knownCtcOffers:1,
    unknownCtcOffers:1,averageInr:1000000,highestInr:1000000});
  expect(detail.offers.totals).toMatchObject({released:4,accepted:3,expiredOutstanding:1});
  expect(detail.joining.totals).toMatchObject({accepted:3,joined:1,pending:2});
 });
 it("SA-REPORT-CSV-01 prevents spreadsheet formula injection and keeps true CSV quotes/CRLF",()=>{
  for(const value of ["=1+2","  +SUM(1,2)","\t@evil","-1","\r=HYPERLINK()"])
   expect(placementReportCsvCell(value).startsWith('"\''),value).toBe(true);
  expect(placementReportCsvCell('a,"b"')).toBe('"a,""b"""');
  const csv=placementReportCsv(["Company","Count"],[['=HYPERLINK("https://evil","click")',2]]);
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain('""click""');
  expect(csv).toContain("\r\n");
 });
});
