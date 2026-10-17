import { z } from "zod";

export const hrApplicantFilterSchema = z.strictObject({
  tab: z.preprocess(value=>{
    if(typeof value!=="string")return value;
    const aliases:Record<string,string>={
      interviews:"rounds",results:"rounds",selections:"offers",
      messages:"overview",requests:"overview",
    };
    return aliases[value.toLowerCase()]??value;
  },z.enum(["overview","applicants","offers","rounds"]).default("overview")),
  stage: z.enum(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","OFFERED","HIRED","REJECTED","WITHDRAWN"]).default("ALL"),
  applicant: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  offerPage: z.coerce.number().int().min(1).max(10000).default(1),
  offerState: z.enum(["ALL", "ISSUED", "ACCEPTED", "DECLINED", "EXPIRED", "WITHDRAWN", "SELECTED", "PENDING_VERIFICATION", "REVOKED"]).default("ALL"),
  roundId: z.string().uuid().optional(),
  outcome: z.enum(["ALL","RECORDED","UNRECORDED","PASS","FAIL","HOLD","ABSENT"]).default("ALL"),
});
export type SharedApplicant = {
  id: string; name: string | null; role: string; status: string;
  screening: string; submittedAt: Date; email: string | null;
  rollNumber?: string | null;
  branch?: string | null; phone?: string | null;
  ugPercentage?: string | null; tenthPercentage?: string | null;
  twelfthOrDiplomaPercentage?: string | null;
};
export type HrApplicantStage="ALL"|"APPLIED"|"SHORTLISTED"|"ASSESSMENT"|"INTERVIEW"|"OFFERED"|"HIRED"|"REJECTED"|"WITHDRAWN";
export const HR_RECRUITER_STAGES:readonly {value:HrApplicantStage;label:string}[]=[
 {value:"ALL",label:"All shared"},{value:"APPLIED",label:"Applied"},{value:"SHORTLISTED",label:"Shortlisted"},
 {value:"ASSESSMENT",label:"Assessment"},{value:"INTERVIEW",label:"Interview"},
 {value:"OFFERED",label:"Offered"},{value:"HIRED",label:"Hired"},{value:"REJECTED",label:"Rejected"},
 {value:"WITHDRAWN",label:"Withdrawn"},
];
export function projectSharedApplicants(rows: readonly SharedApplicant[], stage: HrApplicantStage) {
  const counts = {
    all: rows.length,
    shortlisted: rows.filter(row => row.status === "SUBMITTED").length,
    withdrawn: rows.filter(row => row.status === "WITHDRAWN").length,
  };
  return { counts, rows: rows.filter(row => stage === "ALL" ||
    (stage === "SHORTLISTED" && row.status === "SUBMITTED") ||
    (stage === "APPLIED" && row.status === "SUBMITTED") ||
    (stage === "WITHDRAWN" && row.status === "WITHDRAWN") ||
    ["ASSESSMENT","INTERVIEW","OFFERED","HIRED","REJECTED"].includes(stage)) };
}

export const HR_APPLICANT_PAGE_SIZE = 25;
export function hrApplicantPageBounds(page: number, total: number) {
  return {
    page, pageSize: HR_APPLICANT_PAGE_SIZE,
    pages: Math.ceil(total / HR_APPLICANT_PAGE_SIZE),
    first: total === 0 || (page - 1) * HR_APPLICANT_PAGE_SIZE >= total
      ? 0 : (page - 1) * HR_APPLICANT_PAGE_SIZE + 1,
    last: Math.min(total, page * HR_APPLICANT_PAGE_SIZE),
  };
}

export const HR_OFFER_STATES = ["ALL", "SELECTED", "PENDING_VERIFICATION", "ISSUED", "ACCEPTED", "DECLINED", "EXPIRED", "WITHDRAWN", "REVOKED"] as const;
export const HR_OFFER_PAGE_SIZE = 15;
export function hrOfferPageBounds(page: number, total: number) {
  return {
    page, pageSize: HR_OFFER_PAGE_SIZE, total,
    pages: Math.ceil(total / HR_OFFER_PAGE_SIZE),
    first: total === 0 || (page - 1) * HR_OFFER_PAGE_SIZE >= total ? 0
      : (page - 1) * HR_OFFER_PAGE_SIZE + 1,
    last: Math.min(total, page * HR_OFFER_PAGE_SIZE),
  };
}
