import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  normalizePlacementFailureReason, summarizePlacementFailureReasons,
  summarizePlacementLeads, type PlacementFailureFact, type PlacementLeadReportFact,
} from "@/modules/placements/report-extra-model";
import {
  ACCREDITATION_CSV_HEADINGS, ACCREDITATION_LIMITATIONS, buildAccreditationExport,
  type AccreditationFacts,
} from "@/modules/placements/report-accreditation-model";

const read=(p:string)=>readFileSync(p,"utf8");

describe("Super Admin placement analytics: behavior, tenant scope and honest statutory export",()=>{
  it("SA-REPORT-EXTRA-01 counts each persisted failure only once across duplicate joins",()=>{
    expect(normalizePlacementFailureReason("  interview  not  attended  ")).toBe("interview not attended");
    expect(normalizePlacementFailureReason(null)).toBe("Reason not recorded");
    const facts:PlacementFailureFact[]=[
      {id:"s1",jobId:"job-a",jobTitle:"SDE",companyName:"Acme",kind:"SCREENING_REJECTED",reason:"  Missing  criteria "},
      {id:"s1",jobId:"job-a",jobTitle:"SDE",companyName:"Acme",kind:"SCREENING_REJECTED",reason:"Missing criteria"},
      {id:"s2",jobId:"job-a",jobTitle:"SDE",companyName:"Acme",kind:"SCREENING_REJECTED",reason:"Missing criteria"},
      {id:"d1",jobId:"job-b",jobTitle:"SDET",companyName:"Beta",kind:"OFFER_DECLINED",reason:null},
      {id:"d1",jobId:"job-b",jobTitle:"SDET",companyName:"Beta",kind:"OFFER_WITHDRAWN",reason:null},
    ];
    const report=summarizePlacementFailureReasons(facts);
    expect(report.total).toBe(4);
    expect(report.byKind.find(r=>r.kind==="SCREENING_REJECTED")?.count).toBe(2);
    expect(report.byKind.find(r=>r.kind==="OFFER_DECLINED")?.count).toBe(1);
    expect(report.byKind.find(r=>r.kind==="OFFER_WITHDRAWN")?.count).toBe(1);
    expect(report.byReason.find(r=>r.kind==="SCREENING_REJECTED"&&r.reason==="Missing criteria")?.count).toBe(2);
    expect(report.byDrive.find(r=>r.jobId==="job-a"&&r.kind==="SCREENING_REJECTED")?.count).toBe(2);
    expect(report.byReason.filter(r=>r.reason==="Reason not recorded")).toHaveLength(2);
    expect(facts).toHaveLength(5);
  });

  it("SA-REPORT-EXTRA-02 de-duplicates lead identity and computes click/recruiter conversion without invented people",()=>{
    const rows:PlacementLeadReportFact[]=[
      {id:"l1",manualStage:"NEW",source:"Direct",invited:true,inviteClicked:true,recruiterAccountLinked:true,companyRelationshipLinked:true},
      {id:"l1",manualStage:"NEW",source:"Direct",invited:true,inviteClicked:true,recruiterAccountLinked:true,companyRelationshipLinked:true},
      {id:"l2",manualStage:"NEW",source:null,invited:true,inviteClicked:false,recruiterAccountLinked:false,companyRelationshipLinked:false},
      {id:"l3",manualStage:"CONTACTED",source:"Direct",invited:false,inviteClicked:false,recruiterAccountLinked:true,companyRelationshipLinked:false},
    ];
    const report=summarizePlacementLeads(rows);
    expect(report.totals).toMatchObject({leads:3,invited:2,inviteClicked:1,
      recruiterAccountsLinked:2,companyRelationshipsLinked:1,recruiterLinkRatePercent:67});
    expect(report.byStage.find(r=>r.label==="NEW")?.leads).toBe(2);
    expect(report.bySource.find(r=>r.label==="Direct")?.leads).toBe(2);
    expect(report.bySource.find(r=>r.label==="Not recorded")?.leads).toBe(1);
    expect(summarizePlacementLeads([]).totals.recruiterLinkRatePercent).toBeNull();
  });

  it("SA-ACCREDITATION-01 refuses fabricated statutory cohort denominators and non-existent season certification",()=>{
    const empty:AccreditationFacts={jobs:[],applications:[],offers:[],branches:[]};
    const missing=buildAccreditationExport(null,empty);
    expect(missing.report.metrics.drives).toBe(0);
    expect(missing.seasonName).toBeNull();
    expect(missing.issues.some(i=>i.includes("No placement season"))).toBe(true);
    expect(missing.csv).toContain("Graduating / eligible learner denominator");
    expect(missing.csv).toContain("Not certified");
    expect(missing.rows.filter(r=>r[0]==="Overall")).toHaveLength(0);
    expect(ACCREDITATION_LIMITATIONS.length).toBeGreaterThan(0);
  });

  it("SA-ACCREDITATION-02 reports only accepted offers and known branches without guessing certification rates",()=>{
    const period={name:"2026 placements",code:"P26",startDate:"2026-01-01",endDate:"2026-12-31"};
    const facts:AccreditationFacts={
      jobs:[{id:"j1",title:"Developer",companyId:"c1",companyName:"=HYPERLINK(\"https://evil\",\"X\")",employmentType:"FULL_TIME",countsAsPlaced:true}],
      applications:[
        {id:"a1",jobId:"j1",membershipId:"m1",status:"SUBMITTED",screeningStatus:null},
        {id:"a2",jobId:"j1",membershipId:"m2",status:"SUBMITTED",screeningStatus:null},
      ],
      offers:[
        {id:"o1",jobId:"j1",membershipId:"m1",status:"ACCEPTED",annualCtcInr:1000000,joiningStatus:null},
        {id:"o2",jobId:"j1",membershipId:"m2",status:"ISSUED",annualCtcInr:2000000,joiningStatus:null},
      ],
      branches:[{membershipId:"m1",departmentId:"d1",departmentName:"CSE"}],
    };
    const output=buildAccreditationExport(period,facts);
    const overall=output.rows.find(row=>row[0]==="Overall");
    expect(overall).toBeDefined();
    expect(overall?.[5]).toBe(1);
    expect(overall?.[6]).toBe(2);
    expect(overall?.[9]).toBe(1);
    expect(overall?.[10]).toBe(1);
    expect(overall?.[13]).toBeNull();
    expect(overall?.[14]).toBeNull();
    expect(output.missingBranches).toBe(1);
    expect(output.issues.some(s=>s.includes("lack an attributable programme/branch"))).toBe(true);
    expect(output.csv).toContain("'=HYPERLINK");
    expect(output.csv).toContain(ACCREDITATION_CSV_HEADINGS[13]);
  });

  it("SA-ACCREDITATION-03 preserves selected-college, selected-job and membership boundaries in the database service",()=>{
    const service=read("src/modules/placements/report-accreditation-service.ts");
    expect(service).toContain("context.adminScope?.collegeId !== query.collegeId");
    expect(service).toContain("requirePlacementManageScope(context, query.collegeId)");
    expect(service).toContain("eq(placementJobs.collegeId, query.collegeId)");
    expect(service).toContain("eq(placementJobs.seasonId, season.id)");
    expect(service).toContain("eq(placementCompanyRelationships.collegeId, query.collegeId)");
    expect(service).toContain("eq(collegeMemberships.collegeId, query.collegeId)");
    expect(service).toContain("if (query.jobId && !jobs.some");
    expect(service).toContain('throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND")');
  });
});
