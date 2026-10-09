import { describe, expect, it } from "vitest";
import {
  DEFAULT_TPO_SHARE_VISIBILITY,
  projectTpoShareApplicant,
  type TpoShareApplicant,
} from "@/modules/placements/tpo-share-projection";

const applicant: TpoShareApplicant = {
  applicantId: "APP-1", stage: "APPLIED",
  firstName: "Alex", lastName: "Learner",
  roll: "R42", branch: "CSE", email: "alex@example.org",
  phone: "9876543210", resumeUrl: "/private/resume/1",
  githubUrl: "https://github.com/example",
  portfolioUrl: "https://portfolio.example.org",
  skillMatchScore: 88.7, hiredOnDrive: false,
  marks: {
    UG: { basisPoints: 8275, verified: true },
    "10TH": { basisPoints: 9000, verified: true },
    "12TH": { basisPoints: 8100, verified: true },
  },
};
const now = new Date("2026-10-10T09:00:00Z");
const base = { applicant, visibility: DEFAULT_TPO_SHARE_VISIBILITY, now };

describe("DB09 company visibility projection", () => {
  it("shares allowlisted columns only; no phone before shortlisting", () => {
    expect(projectTpoShareApplicant({
      ...base, requestedColumns: ["name", "cgpa", "phone", "aadhaar", "skillMatch", "attendance"],
    })).toEqual({ applicantId: "APP-1", name: "Alex Learner", cgpa: "80-85%" });
    expect(projectTpoShareApplicant({
      ...base, applicant: { ...applicant, stage: "SHORTLISTED" },
      requestedColumns: ["phone"],
    })).toEqual({ applicantId: "APP-1", phone: "9876543210" });
  });

  it("fails closed for unknown stages and stage ceiling violations", () => {
    expect(projectTpoShareApplicant({
      ...base, applicant: { ...applicant, stage: "SECRET" }, requestedColumns: ["name"],
    })).toBeNull();
    expect(projectTpoShareApplicant({
      ...base, applicant: { ...applicant, stage: "INTERVIEW" },
      maxStage: "SHORTLISTED", requestedColumns: ["name"],
    })).toBeNull();
  });

  it("suppresses old nonhired learner contact after 90-day retention", () => {
    const fields = ["name", "email", "phone", "resume", "projects"];
    const inputs = {
      ...base, requestedColumns: fields,
      applicant: { ...applicant, stage: "HIRED" },
      driveClosedAt: new Date("2026-06-01T09:00:00Z"),
    };
    expect(projectTpoShareApplicant(inputs)).toEqual({
      applicantId: "APP-1", name: "Alex Learner",
    });
    expect(projectTpoShareApplicant({
      ...inputs, applicant: { ...inputs.applicant, hiredOnDrive: true },
    })).toMatchObject({
      email: "alex@example.org", phone: "9876543210",
    });
  });

  it("keeps unverified grades private and uses verified Diploma as 12th fallback", () => {
    expect(projectTpoShareApplicant({
      ...base, requestedColumns: ["cgpa", "tenth", "twelfth"],
      applicant: {
        ...applicant, marks: {
          UG: { basisPoints: 8500, verified: false },
          "10TH": { basisPoints: 9200, verified: true },
          "12TH": { basisPoints: 7000, verified: false },
          DIPLOMA: { basisPoints: 8400, verified: true },
        },
      },
    })).toEqual({ applicantId: "APP-1", tenth: 92, twelfth: 84 });
  });

  it("gates recruiter screening score, project links and precise grades", () => {
    expect(projectTpoShareApplicant({
      ...base, requestedColumns: ["cgpa", "projects", "skillMatch", "tenth", "attendance"],
      visibility: {
        ...DEFAULT_TPO_SHARE_VISIBILITY,
        showCgpaExact: true, showTenthTwelfth: false,
        showProjectLinks: false, showAssessmentScores: true,
        showAttendance: true,
      },
    })).toEqual({ applicantId: "APP-1", cgpa: "82.8", skillMatch: 89 });
  });

  it("bands 100%, rejects impossible/unverified percentage inputs", () => {
    const makeMarks = (basisPoints: number) => ({
      ...base, requestedColumns: ["cgpa"],
      applicant: {
        ...applicant, marks: {
          UG: { basisPoints, verified: true },
        },
      },
    });
    expect(projectTpoShareApplicant(makeMarks(10000))).toMatchObject({
      cgpa: "95-100%",
    });
    expect(projectTpoShareApplicant(makeMarks(10100))).toEqual({
      applicantId: "APP-1",
    });
  });
});
