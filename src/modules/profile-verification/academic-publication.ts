import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementCandidateAcademicEvidence } from "@/db/schema";
import {
  profileVerificationAcademicMarks,
  profileVerificationSettings,
} from "@/db/schema/profile-verification";
import {
  convertedPercentageBasisPoints,
  normaliseCgpaRule, normaliseMarkScale,
  type RawAcademicMark,
} from "./academic-marks";
import { educationLevel } from "./evidence";
import { VerificationStateError, type SafeSnapshot } from "./domain";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type AcademicLevel = "10TH" | "12TH" | "DIPLOMA" | "UG" | "PG";
type RawEntry = { level: AcademicLevel; grade: string; scale: string; max: string; endYear: string };
function parseAcademicSnapshot(snapshot: SafeSnapshot): RawEntry[] {
  const data = snapshot.education;
  if (!Array.isArray(data) || data.length === 0) throw new VerificationStateError("INVALID_SNAPSHOT");
  const seen = new Set<AcademicLevel>();
  const parsed: RawEntry[] = [];
  for (const obj of data) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new VerificationStateError("INVALID_SNAPSHOT");
    const raw = obj as Record<string, unknown>;
    if (typeof raw.educationType !== "string" || typeof raw.grade !== "string" ||
        typeof raw.gradingType !== "string" || typeof raw.max !== "string") {
      throw new VerificationStateError("INVALID_SNAPSHOT");
    }
    const level = educationLevel(raw.educationType);
    if (!level || seen.has(level) || raw.grade.trim() === "") {
      throw new VerificationStateError("INVALID_SNAPSHOT");
    }
    seen.add(level);
    parsed.push({
      level, grade:raw.grade.trim(), scale:raw.gradingType,
      max:raw.max, endYear:typeof raw.endYear==="string" ? raw.endYear : "",
    });
  }
  if (!seen.has("10TH") || (!seen.has("12TH") && !seen.has("DIPLOMA")) ||
      (!seen.has("UG") && !seen.has("PG"))) throw new VerificationStateError("INVALID_SNAPSHOT");
  return parsed;
}
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
  const [setting] = await tx.select({rule:profileVerificationSettings.cgpaToPct})
    .from(profileVerificationSettings)
    .where(eq(profileVerificationSettings.collegeId,args.collegeId)).for("update");
  const rule = normaliseCgpaRule(setting?.rule);
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
