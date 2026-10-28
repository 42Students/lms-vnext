import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDatabaseConnection, getDb } from "@/db/client";
import { learnerProfileEducationDocuments, learnerProfileEducationEntries } from "@/db/schema";
import { syncLearnerEducationProjection } from "@/modules/people/learner-education-projection-service";
import { learnerProfileEducationWriteSchema } from "@/modules/people/profile-validation";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const rollback = Symbol("DB-007 rollback");

function row(id: string, grade = "8.6", recent = true) {
  return learnerProfileEducationWriteSchema.parse([{
    id, educationType: "UG", institution: "DB007 Disposable College",
    gradingType: grade ? "CGPA" : "", gradeObtained: grade,
    maxGrade: grade ? "10" : "", isRecentEducation: recent,
    startYear: "2021", endYear: "2025",
  }])[0]!;
}
async function inRollback(fn: (tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0])=>Promise<void>) {
  await expect(getDb().transaction(async tx => {
    await fn(tx);
    throw rollback;
  })).rejects.toBe(rollback);
}
afterAll(async () => { if (enabled) await closeDatabaseConnection(); });

describe.skipIf(!enabled)("DB-007 normalized education follows versioned learner profile edits", () => {
  it("materializes only complete education; swaps recent identity and archives old rows", async () => {
    await inRollback(async tx => {
      const owner = SEED_IDS.learnerCollegeAMembership;
      const id = randomUUID(), other = randomUUID();
      await syncLearnerEducationProjection(tx, owner, [row(id, "")]);
      let entries = await tx.select().from(learnerProfileEducationEntries)
        .where(eq(learnerProfileEducationEntries.learnerMembershipId, owner));
      expect(entries.some(x=>x.id===id)).toBe(false);

      await syncLearnerEducationProjection(tx, owner, [row(id)]);
      entries = await tx.select().from(learnerProfileEducationEntries)
        .where(eq(learnerProfileEducationEntries.learnerMembershipId, owner));
      expect(entries.find(x=>x.id===id)).toMatchObject({
        gradeObtained:"8.6", gradingType:"CGPA", isRecentEducation:true, archivedAt:null,
      });
      await syncLearnerEducationProjection(tx, owner, [row(id,"8.6",false),row(other,"9.1",true)]);
      entries = await tx.select().from(learnerProfileEducationEntries)
        .where(eq(learnerProfileEducationEntries.learnerMembershipId, owner));
      expect(entries.filter(x=>x.isRecentEducation && x.archivedAt===null).map(x=>x.id)).toEqual([other]);
      await syncLearnerEducationProjection(tx, owner, [row(other,"9.1",true)]);
      entries = await tx.select().from(learnerProfileEducationEntries)
        .where(eq(learnerProfileEducationEntries.learnerMembershipId, owner));
      expect(entries.find(x=>x.id===id)?.archivedAt).not.toBeNull();
      expect(entries.find(x=>x.id===other)?.archivedAt).toBeNull();
    });
  });
  it("rejects ownership collisions instead of reassigning another learner's UUID",async()=>{
    await inRollback(async tx=>{
      const foreign=SEED_IDS.facultyCollegeBMembership,owner=SEED_IDS.learnerCollegeAMembership;
      const id=randomUUID();
      await syncLearnerEducationProjection(tx,foreign,[row(id)]);
      await expect(syncLearnerEducationProjection(tx,owner,[row(id)]))
        .rejects.toThrow("EDUCATION_OWNERSHIP_CONFLICT");
      const [unchanged]=await tx.select().from(learnerProfileEducationEntries)
        .where(eq(learnerProfileEducationEntries.id,id));
      expect(unchanged?.learnerMembershipId).toBe(foreign);
    });
  });
  it("does not publish a certificate without a CLEAN exact-owner receipt",async()=>{
    await inRollback(async tx=>{
      const owner=SEED_IDS.learnerCollegeAMembership,id=randomUUID();
      const input=learnerProfileEducationWriteSchema.parse([{
        id,educationType:"UG",institution:"DB007 College",
        gradingType:"CGPA",gradeObtained:"9",maxGrade:"10",
        certificateReceiptId:randomUUID(),
      }]);
      await expect(syncLearnerEducationProjection(tx,owner,input))
        .rejects.toThrow("EDUCATION_RECEIPT_INVALID");
      const docs=await tx.select().from(learnerProfileEducationDocuments)
        .where(eq(learnerProfileEducationDocuments.learnerMembershipId,owner));
      expect(docs.filter(x=>x.educationEntryId===id)).toHaveLength(0);
    });
  });
});
