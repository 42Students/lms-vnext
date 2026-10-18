import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoJobTypeNameSchema} from "@/modules/placements/tpo-configuration-model";

const source=readFileSync("src/modules/placements/tpo-job-type-write-service.ts","utf8");
const entries=[
 {name:"setTpoJobTypeActive",noop:"if(current.active===input.active)",cas:"if(current.updatedAt.toISOString()!==input.expectedVersion)"},
 {name:"renameTpoJobType",noop:"if(current.label===input.label)",cas:"if(current.updatedAt.toISOString()!==input.expectedVersion)"},
 {name:"setTpoBuiltinJobTypeActive",noop:"if(current?.active===input.active&&current.isBuiltin)",cas:'if((current?.updatedAt.toISOString()??"none")!==input.expectedVersion)'},
 {name:"setTpoJobTypeCountsAsPlaced",noop:"if(current.countsAsPlaced===input.countsAsPlaced)",cas:"if(current.updatedAt.toISOString()!==input.expectedVersion)"},
] as const;
function handler(name:string){
 const start=source.indexOf("export async function "+name+"(");
 const next=source.indexOf("\nexport async function ",start+1);
 expect(start).toBeGreaterThanOrEqual(0);
 return source.slice(start,next===-1?source.length:next);
}

describe("TPO-settings-audit-23 atomic, idempotent job-type config changes",()=>{
 it.each(entries)("TPO-settings-audit-23 $name recognizes a lost-response retry before rejecting stale CAS",({name,noop,cas})=>{
  const action=handler(name);
  const permission=action.indexOf("assertPersistedPlatformPermission(tx,");
  const same=action.indexOf(noop);
  const stale=action.indexOf(cas);
  const update=action.indexOf("tx.update(placementTpoJobTypes)");
  const event=action.indexOf("tx.insert(activityEvents)");
  expect(permission).toBeGreaterThan(0);
  expect(same).toBeGreaterThan(permission);
  expect(stale).toBeGreaterThan(same);
  expect(update).toBeGreaterThan(stale);
  expect(event).toBeGreaterThan(update);
  expect(action).toContain('greatest(clock_timestamp(),date_trunc(\'milliseconds\'');
  expect(action).toContain('interval \'1 millisecond\'');
  expect(action).toContain("return {changed:false,updatedAt:");
 });
 it("TPO-settings-audit-23 still rejects stale desired changes and protects foreign colleges",()=>{
  for(const entry of entries){
   const action=handler(entry.name);
   expect(action).toContain('new TpoConfigError("TPO_SETTINGS_STALE")');
   expect(action).toContain("eq(placementTpoJobTypes.collegeId,collegeId)");
  }
 });
 it("TPO-settings-audit-23 refuses symbol-only labels while allowing Indian scripts",()=>{
  expect(tpoJobTypeNameSchema.safeParse("--")).toMatchObject({success:false});
  expect(tpoJobTypeNameSchema.safeParse("తెలుగు ఉద్యోగం")).toMatchObject({success:true});
 });
});
