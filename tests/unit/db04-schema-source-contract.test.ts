import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root=process.cwd();
const candidate=readFileSync(path.join(root,"docs/planning/db04-proposed-migration.sql"),"utf8");
const drizzle=readFileSync(path.join(root,"src/db/schema/profile-verification.ts"),"utf8");
const transaction=readFileSync(path.join(root,"src/modules/profile-verification/transaction-writer.ts"),"utf8");

describe("DB04 staged schema source contract (not SQL execution)",()=>{
  const required=[
    "profile_verifications","profile_verification_events",
    "profile_private_document_receipts","profile_verification_settings",
    "profile_verification_tpo_grants","profile_verification_academic_marks",
  ];
  it("declares every proposed table in SQL and Drizzle",()=>{
    for(const name of required){
      expect(candidate).toContain("CREATE TABLE "+name);
      expect(drizzle).toContain('pgTable("'+name+'"');
    }
  });
  it("keeps verification and document provenance constrained",()=>{
    expect(candidate).toContain("UNIQUE (learner_membership_id,section)");
    expect(candidate).toContain("FOREIGN KEY (verification_id,learner_membership_id)");
    expect(candidate).toContain("CHECK (position('://' IN private_object_key)=0)");
    expect(candidate).toContain("source_snapshot_version");
  });
  it("rejects event history updates/deletes and version skipping",()=>{
    expect(candidate).toContain("BEFORE UPDATE OR DELETE ON profile_verification_events");
    expect(candidate).toContain("BEFORE UPDATE ON profile_verifications");
    expect(candidate).toContain("NEW.row_version <> OLD.row_version+1");
  });
  it("locks and revalidates actual learner and reviewer roles before commit",()=>{
    expect(transaction).toContain('eq(membershipRoles.role,"LEARNER")');
    expect(transaction).toContain('eq(systemRoles.role,"SUPER_ADMIN")');
    expect(transaction).toContain('eq(membershipRoles.role,expectedRole)');
    expect(transaction).toContain('profileVerificationTpoGrants.revokedAt');
    expect(transaction).toContain('profileVerificationSettings.tpoCanVerifyProfiles');
    expect(transaction).toContain('platformUser?.status !== "ACTIVE"');
  });
  it("requires transactional same-key first-write serialization and atomic academic output",()=>{
    expect(transaction).toContain("pg_advisory_xact_lock");
    expect(transaction).toContain("publishVerifiedEducation(tx");
    expect(transaction).toContain("tx.insert(profileVerificationEvents)");
    expect(transaction).toContain("getDb().transaction");
  });
});
