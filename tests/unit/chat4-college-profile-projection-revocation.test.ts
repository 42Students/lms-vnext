import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const read=()=>readFileSync("src/modules/people/college-person-profile-overview-service.ts","utf8");
const college="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"actor",identityUid:"id",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

describe("College Admin private profile projections and revoked session controls",()=>{
 it("COL-people-profile-ACTOR-01 excludes revoked college admins from the private profile read",()=>{
  const s=read();
  const scope=s.indexOf('resolveActingCollege(ctx,"people.manage")');
  const auth=s.indexOf('assertPersistedPlatformPermission(tx,ctx,"people.manage"');
  const select=s.indexOf("return tx.select({");
  const tenant=s.indexOf("eq(collegeMemberships.collegeId,scope.collegeId)");
  expect(scope).toBeGreaterThan(-1);
  expect(auth).toBeGreaterThan(scope);
  expect(select).toBeGreaterThan(auth);
  expect(tenant).toBeGreaterThan(select);
  expect(s).toContain("getDb().transaction(async tx=>");
  expect(can(actor,"people.manage",{collegeId:college,organizationId:org})).toBe(true);
  expect(can({...actor,membership:{...actor.membership!,status:"ENDED"}},"people.manage",
   {collegeId:college,organizationId:org})).toBe(false);
  expect(can({...actor,user:{...actor.user,platformStatus:"DISABLED"}},"people.manage",
   {collegeId:college,organizationId:org})).toBe(false);
 });

 it("COL-people-profile-PRIVACY-01 returns only sanctioned summary arrays and a masking notice",()=>{
  const s=read();
  expect(s).toContain('z.enum(["FACULTY","LEARNER"]).parse(rawKind)');
  expect(s).toContain("facultyProfileDocumentSchema.parse");
  expect(s).toContain("learnerProfileDocumentSchema.parse");
  expect(s).toContain("Identity numbers and supporting documents are private and are not shown here.");
  expect(s).toContain("skills:d.skills.map");
  expect(s).toContain("certifications:d.certifications.map");
  expect(s).not.toContain("identityNumber:");
  expect(s).not.toContain("aadhaar:");
  expect(s).not.toContain("panNumber:");
  expect(s).not.toContain("signedDownloadUrl:");
  expect(s).toContain('if(!row)throw Error("PERSON_NOT_FOUND")');
 });
});
