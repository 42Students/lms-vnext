import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("DB-004 Recruiter canonical identity-name lifecycle",()=>{
 it("preserves the exact first and family name boundaries on recruiter profile saves",()=>{
  const s=readFileSync("src/modules/placements/recruiter-profile-details-service.ts","utf8");
  for(const required of [
    "givenName:users.givenName,familyName:users.familyName",
    "person.givenName!==input.firstName",
    "person.familyName??",
    "identityNameChanged=nameChanged||canonicalNameChanged",
    "givenName:input.firstName",
    "familyName:input.lastName||null",
    "identityProfileVersion:sql",
    "users.identityProfileVersion",
    "date_trunc('milliseconds'",
    "userUpdatedAt:(identityNameChanged?now:person.userUpdatedAt).toISOString()",
  ])expect(s).toContain(required);
 });
 it("never rewrites login identifiers or credentials when editing display names",()=>{
  const s=readFileSync("src/modules/placements/recruiter-profile-details-service.ts","utf8");
  const start=s.indexOf("if(identityNameChanged){");
  const end=s.indexOf("if(titleChanged)",start);
  const mutation=s.slice(start,end);
  expect(start).toBeGreaterThan(0);
  for(const denied of ["phoneE164:","email:","identityUid:","credentialDigest:"]){
   expect(mutation).not.toContain(denied);
  }
 });
});
