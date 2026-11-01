import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {resolveModuleAccessFromRules} from "@/modules/module-access/service";
const college="20000000-0000-4000-8000-000000000001";
const organization="10000000-0000-4000-8000-000000000001";
const chain=[
 {scopeType:"COLLEGE" as const,scopeId:college},
 {scopeType:"ORGANIZATION" as const,scopeId:organization},
 {scopeType:"GLOBAL" as const,scopeId:null},
];
describe("DB19-P20 placements module authorization under live college lock",()=>{
 it("an explicitly locked ancestor deny supersedes a locally enabled college",()=>{
  const resolved=resolveModuleAccessFromRules(chain,[
   {scopeType:"COLLEGE",scopeId:college,module:"placements",enabled:true,locked:false},
   {scopeType:"ORGANIZATION",scopeId:organization,module:"placements",enabled:false,locked:true},
  ]);
  expect(resolved.placements).toMatchObject({
   enabled:false,locked:true,level:"ORGANIZATION",scopeId:organization,
  });
 });
 it("does not invent a placement entitlement when no policy exists",()=>{
  expect(resolveModuleAccessFromRules(chain,[]).placements).toMatchObject({
   enabled:false,level:"DEFAULT",
  });
 });
 it("checks live rules inside registration transaction after acquiring the college lock",()=>{
  const source=readFileSync("src/modules/placements/batch-registration-service.ts","utf8");
  const transaction=source.indexOf("return db.transaction(async (tx) =>");
  const collegeLock=source.indexOf('.for("update")',transaction);
  const policyRead=source.indexOf("const liveModuleRules = await tx.select(",collegeLock);
  const policyLock=source.indexOf('.for("share")',policyRead);
  const liveGate=source.indexOf('if(!liveModules.placements.enabled)',policyLock);
  const registrationInsert=source.indexOf('tx.insert(placementBatchRegistrations)',liveGate);
  expect(transaction).toBeGreaterThan(0);
  expect(collegeLock).toBeGreaterThan(transaction);
  expect(policyRead).toBeGreaterThan(collegeLock);
  expect(policyLock).toBeGreaterThan(policyRead);
  expect(liveGate).toBeGreaterThan(policyLock);
  expect(registrationInsert).toBeGreaterThan(liveGate);
 });
});
