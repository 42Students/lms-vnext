import {describe,expect,it} from "vitest";
import {mapLegacyJobApplicationForMigration} from "@/modules/placements/legacy-application-migration-model";
const ids={
 jobId:"56fb482a-f8f2-4b40-ac20-72a362a6abc4",
 learnerMembershipId:"9d3c9883-7650-4bf8-b53b-c7fe1e12e58f",
 roleOptionId:"6fa5c8a0-0d56-4af0-98b7-8c73a3ef08ad",
};
describe("legacy job application migration crosswalk",()=>{
 it("maps job, membership, role without accepting browser learner identity",()=>{
  const result=mapLegacyJobApplicationForMigration({
   legacyJobId:5,legacyLearnerId:7,legacyRoleId:9,
  },ids);
  expect(result).toMatchObject({jobId:ids.jobId,
   learnerMembershipId:ids.learnerMembershipId,roleOptionId:ids.roleOptionId,
   resume:{status:"NONE_PROVIDED"}});
 });
 it("does not copy a public resume URL into a private file record",()=>{
  const result=mapLegacyJobApplicationForMigration({
   legacyJobId:5,legacyLearnerId:7,
   resumeUrl:"https://legacy.example/private.pdf?secret=not-migrated",
  },{...ids,roleOptionId:null});
  expect(result.resume).toMatchObject({status:"NOT_IMPORTED",legacyUrlRetained:false,
   reason:"PRIVATE_STORAGE_ATTESTATION_REQUIRED"});
  expect(JSON.stringify(result)).not.toContain("secret");
 });
 it("rejects unresolved legacy roles instead of silently choosing primary",()=>{
  expect(()=>mapLegacyJobApplicationForMigration({
   legacyJobId:5,legacyLearnerId:7,legacyRoleId:9,
  },{...ids,roleOptionId:null})).toThrow("LEGACY_APPLICATION_ROLE_MAPPING_REQUIRED");
 });
});
