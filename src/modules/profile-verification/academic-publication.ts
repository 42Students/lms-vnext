import { and, eq, notInArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, placementCandidateAcademicEvidence } from "@/db/schema";
import {
  profileVerificationAcademicMarks,
  profileVerificationSettings,
} from "@/db/schema/profile-verification";
import {
  convertedPercentageBasisPoints,
  normaliseCgpaRule, normaliseMarkScale,
  type RawAcademicMark,
} from "./academic-marks";
import type { SafeSnapshot } from "./domain";
import { parseAcademicSnapshot, type AcademicLevel, type RawEntry } from "./academic-snapshot";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
function cgpaHundredths(entry: RawEntry | undefined): number | null {
  if (!entry || normaliseMarkScale(entry.scale)!=="CGPA") return null;
  if (entry.max && Number(entry.max)!==10) return null;
  if (!/^\d{1,2}(?:\.\d{1,3})?$/.test(entry.grade)) return null;
  const scaled = Math.round(Number(entry.grade)*100);
  return scaled>=0 && scaled<=1000 ? scaled : null;
}
function year(s: string | undefined): number | null {
  if (!s || !/^\d{4}$/.test(s)) return null;
  const n = Number(s);
  return n>=1950 && n<=2200 ? n:null;
}

/**
 * Called INSIDE the same transaction as verification row/event persistence.
 * Stores original grades and explicitly refreshes the eligibility/read model.
 */
export async function publishVerifiedEducation(
  tx: Tx,
  args: { verificationId: string; membershipId: string; collegeId: string;
    verifiedSnapshot: SafeSnapshot; version: number; reviewerId: string; verifiedAt: Date },
): Promise<void> {
  const entries = parseAcademicSnapshot(args.verifiedSnapshot);
  // Lock college even if settings row does not yet exist. This serializes
  // verification publication with a concurrent CGPA policy change.
  await tx.select({id:colleges.id}).from(colleges)
    .where(eq(colleges.id,args.collegeId)).for("update");
  const [setting] = await tx.select({rule:profileVerificationSettings.cgpaToPct})
    .from(profileVerificationSettings)
    .where(eq(profileVerificationSettings.collegeId,args.collegeId)).for("update");
  const rule = normaliseCgpaRule(setting?.rule);
  // Prune levels removed since the last verified snapshot before replacing
  // remaining rows. Keep deletion and evidence publication in one transaction.
  await tx.delete(profileVerificationAcademicMarks).where(and(
    eq(profileVerificationAcademicMarks.learnerMembershipId,args.membershipId),
    notInArray(profileVerificationAcademicMarks.level,entries.map(entry=>entry.level)),
  ));
  const computed = new Map<AcademicLevel, number | null>();
  for (const entry of entries) {
    const mark:RawAcademicMark={grade:entry.grade,scale:entry.scale,max:entry.max};
    const pct=convertedPercentageBasisPoints(mark,rule);
    computed.set(entry.level,pct);
    await tx.insert(profileVerificationAcademicMarks).values({
      verificationId:args.verificationId,learnerMembershipId:args.membershipId,
      level:entry.level,originalGrade:entry.grade,originalScale:entry.scale,
      originalMax:entry.max,percentageBasisPoints:pct,appliedRule:rule,
      sourceSnapshotVersion:args.version,verifiedByUserId:args.reviewerId,
      verifiedAt:args.verifiedAt,
    }).onConflictDoUpdate({
      target:[profileVerificationAcademicMarks.learnerMembershipId,
        profileVerificationAcademicMarks.level],
      set:{
        verificationId:args.verificationId,originalGrade:entry.grade,
        originalScale:entry.scale,originalMax:entry.max,
        percentageBasisPoints:pct,appliedRule:rule,
        sourceSnapshotVersion:args.version,verifiedByUserId:args.reviewerId,
        verifiedAt:args.verifiedAt,updatedAt:new Date(),
      },
    });
  }
  const pg=entries.find(e=>e.level==="PG");
  const ug=entries.find(e=>e.level==="UG");
  const passingYear=year(pg?.endYear) ?? year(ug?.endYear);
  const percentages={
    cgpaHundredths:cgpaHundredths(ug),
    // These optional fields are not in the verified Education snapshot.
    // Do not relabel earlier SELF assertions as VERIFIED after approval.
    activeBacklogs:null,pastBacklogs:null,gapYears:null,isLateralEntry:false,
    tenthPctBasisPoints:computed.get("10TH") ?? null,
    twelfthPctBasisPoints:computed.get("12TH") ?? null,
    diplomaPctBasisPoints:computed.get("DIPLOMA") ?? null,
    undergraduatePctBasisPoints:computed.get("UG") ?? null,
    passingYear,source:"VERIFIED" as const,
    verifiedByUserId:args.reviewerId,verifiedAt:args.verifiedAt,
    updatedAt:new Date(),
  };
  await tx.insert(placementCandidateAcademicEvidence).values({
    membershipId:args.membershipId,...percentages,
  }).onConflictDoUpdate({
    target:placementCandidateAcademicEvidence.membershipId,
    set:percentages,
  });
}
