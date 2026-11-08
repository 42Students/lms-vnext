import { describe, expect, it } from "vitest";
import { collegeContentCsv, legacyLessonContentCsv } from "@/modules/courses/college-content-csv-model";
import { buildHrApplicantCsv } from "@/modules/placements/hr-applicant-export-model";
import { buildHrActivityCsv } from "@/modules/placements/hr-activity-csv-model";
import { buildHrCalendarCsv } from "@/modules/placements/hr-calendar-export-model";
import { buildHrCompanyReportCsv } from "@/modules/placements/hr-company-report-export-model";
import { hrDriveProposalHistoryCsv } from "@/modules/placements/hr-drive-proposal-export-model";
import { buildHrDrivesCsv } from "@/modules/placements/hr-drives-csv-model";
import { buildHrInboxCsv } from "@/modules/placements/hr-inbox-csv-model";
import { buildHrOfferCsv } from "@/modules/placements/hr-offer-export-model";
import { buildHrTeamCsv } from "@/modules/placements/hr-team-csv-model";

const date = new Date("2026-11-08T05:15:00.000Z");
const invisibleFormula = "\u200B\u0301=HYPERLINK(1,2)";
const expectedCellStart = '"\'' + invisibleFormula;

describe("UX-G173/G179: CSV cell safety across the ten legacy export renderers", () => {
  it("preserves college content column order and neutralizes Unicode-prefixed formulas", () => {
    const row = {
      title: invisibleFormula, course: "Course", lesson: "Lesson", status: "Published",
      scope: "College", visible: "Yes", details: "No private storage references",
      id: "content-1", type: "Video", sequence: 1, points: 0,
    };
    const primary = collegeContentCsv([row]);
    const legacy = legacyLessonContentCsv([row]);
    expect(primary).toContain(expectedCellStart);
    expect(legacy).toContain(expectedCellStart);
    expect(primary.split("\r\n")[0]).toContain('"Student visibility"');
    expect(legacy.split("\r\n")[0]).toContain('"sequence"');
    expect(primary).not.toContain("private@example.test");
  });

  it("neutralizes Unicode-invisible formula prefixes across nine recruiter CSV flows", () => {
    const outputs = [
      ["applicants", buildHrApplicantCsv([{id:"app-1",name:invisibleFormula,role:"Developer",
        status:"SUBMITTED",screening:"SHORTLISTED",submittedAt:date,
        email:"private@example.test"}],1).csv],
      ["activity", buildHrActivityCsv([{id:"evt-1",jobId:"job-1",title:invisibleFormula,
        status:"PUBLISHED",occurredAt:date}],false).csv],
      ["calendar", buildHrCalendarCsv([{kind:"ROUND",title:invisibleFormula,
        jobTitle:"Developer",startsAt:date,status:"SCHEDULED",jobId:"job-1"}],[],"ALL").csv],
      ["company report", buildHrCompanyReportCsv([{title:invisibleFormula,status:"PUBLISHED",
        applications:0,submittedApplications:0,withdrawnApplications:0,
        outstandingOffers:0,acceptedOffers:0,declinedOffers:0,joinedOffers:0}] as never,1).csv],
      ["proposals", hrDriveProposalHistoryCsv([{referenceId:"proposal-1",
        title:invisibleFormula,createdAt:date}])],
      ["drives", buildHrDrivesCsv([{job:{id:"job-1",title:invisibleFormula,
        status:"PUBLISHED",employmentType:"FULL_TIME",workMode:"REMOTE",
        applicationDeadline:date}}] as never,false).csv],
      ["inbox", buildHrInboxCsv([{id:"evt-1",jobId:"job-1",title:invisibleFormula,
        label:"Status changed",createdAt:date,unread:true}],1).csv],
      ["offers", buildHrOfferCsv([{id:"offer-1",name:invisibleFormula,role:"Developer",
        status:"ISSUED",annualCtcInr:null,joiningDate:null,issuedAt:date,
        expiresAt:null,joiningStatus:null}],1).csv],
      ["team", buildHrTeamCsv([{displayName:invisibleFormula,title:"Recruiter",
        email:"recruiter@example.test",isYou:true}]).csv],
    ] as const;

    expect(outputs).toHaveLength(9);
    for (const [flow, csv] of outputs) {
      expect(csv, flow).toContain(expectedCellStart);
      expect(csv, flow).not.toContain('"'+invisibleFormula);
      expect(csv, flow).not.toContain("private@example.test");
      expect(csv.split("\r\n").length, flow).toBeGreaterThan(1);
    }
  });

  it("keeps benign labels unprefixed and preserves escaped quote semantics", () => {
    const csv = collegeContentCsv([{title:'Alice "A"',course:"Course",lesson:"Lesson",
      status:"Published",scope:"College",visible:"Yes",details:"Safe"}]);
    expect(csv).toContain('"Alice ""A"""');
    expect(csv).not.toContain('"\'Alice');
    const recruiter = buildHrTeamCsv([{displayName:"Alice",title:"Recruiter",
      email:"alice@example.test",isYou:false}]).csv;
    expect(recruiter).toContain('"Alice"');
    expect(recruiter).not.toContain('"\'Alice"');
  });
});
