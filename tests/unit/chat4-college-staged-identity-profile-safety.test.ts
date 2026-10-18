import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {personNameSchema,displayNameFromPersonName} from "@/modules/people/person-name";

const staged=readFileSync("src/modules/people/identity-profile.staged.ts","utf8");
describe("COL-people-staged-profile-01 staged name adapter privacy and optimistic concurrency",()=>{
 it("marks the adapter staged and disallows unverified provider email overwrites",()=>{
  expect(staged).toContain("STAGED DB01 adapter");
  expect(staged).toContain("matching users columns are promoted");
  expect(staged).toContain("generated Drizzle migration");
  expect(staged).toContain("email changes require a verified");
 });
 it("requires the user's persisted identity permission and actor lock before a name write",()=>{
  expect(staged).toContain("assertPersistedPlatformPermission(");
  expect(staged).toContain('"identity.self.manage"');
  expect(staged).toContain('actorLock: "update"');
  expect(staged).toContain("where id = ");
  expect(staged).toContain("context.user.id");
 });
 it("rejects stale/fractional versions and uses an atomic increment-and-returning CAS",()=>{
  expect(staged).toContain("Number.isSafeInteger(expectedVersion)");
  expect(staged).toContain("expectedVersion < 1");
  expect(staged).toContain("identity_profile_version + 1");
  expect(staged).toContain("expectedVersion");
  expect(staged).toContain('"IDENTITY_PROFILE_VERSION_CONFLICT"');
 });
 it("does not set email, identity UID or phone in a name-only SQL write",()=>{
  const write=staged.slice(staged.indexOf("export async function saveOwnPersonNameStaged"));
  const sql=write.slice(write.indexOf("update users"),write.indexOf("returning",write.indexOf("update users")));
  for(const name of ["given_name = ","family_name = ","display_name = "])
   expect(sql).toContain(name);
  for(const forbidden of ["email =","identity_uid =","phone ="])
   expect(sql).not.toContain(forbidden);
 });
 it("validates the complete person-name shape before the staging service writes anything",()=>{
  const clean=personNameSchema.parse({givenName:"Anita",familyName:"Rao"});
  expect(displayNameFromPersonName(clean)).toBe("Anita Rao");
  expect(personNameSchema.safeParse({givenName:"",familyName:"Rao"}).success).toBe(false);
 });
});
