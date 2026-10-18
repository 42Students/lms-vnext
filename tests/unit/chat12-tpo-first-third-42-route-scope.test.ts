import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

/**
 * TPO first-third ROUTE-SOURCE contract. These assertions ensure each
 * entrypoint either delegates to a scoped data service or redirects to
 * another protected route. They do not simulate a browser or database.
 */
const pages=[
 "/tpo","/tpo/announcements","/tpo/audit","/tpo/audit/actors",
 "/tpo/batches","/tpo/batches/[batchId]","/tpo/batches/[batchId]/classes",
 "/tpo/batches/[batchId]/history","/tpo/batches/[batchId]/invitation-prep",
 "/tpo/batches/[batchId]/nudge-prep","/tpo/batches/[batchId]/registrations",
 "/tpo/batches/[batchId]/registrations/[membershipId]/history",
 "/tpo/batches/[batchId]/reminder-prep","/tpo/batches/[batchId]/rules",
 "/tpo/batches/[batchId]/students","/tpo/calendar","/tpo/calendar/export",
 "/tpo/calendar/interviews","/tpo/calendar/rounds","/tpo/companies",
 "/tpo/companies/[companyId]","/tpo/companies/[companyId]/contact-log",
 "/tpo/companies/[companyId]/feedback","/tpo/companies/[companyId]/manage",
 "/tpo/companies/[companyId]/people","/tpo/companies/archived",
 "/tpo/drive-day","/tpo/drive-day/[roundId]",
 "/tpo/drive-day/[roundId]/no-shows","/tpo/find","/tpo/follow-ups",
 "/tpo/home","/tpo/messages","/tpo/messages/[threadId]",
 "/tpo/messages/notifications","/tpo/more","/tpo/notifications",
 "/tpo/placements","/tpo/placements/jobs/[jobId]",
 "/tpo/placements/jobs/[jobId]/about",
 "/tpo/placements/jobs/[jobId]/applicants",
 "/tpo/placements/jobs/[jobId]/applicants-pipeline",
] as const;
const alias=new Set<string>([
 "/tpo","/tpo/batches/[batchId]/invitation-prep",
 "/tpo/batches/[batchId]/nudge-prep",
 "/tpo/batches/[batchId]/reminder-prep",
 "/tpo/messages/notifications","/tpo/placements",
 "/tpo/placements/jobs/[jobId]/applicants",
]);
const delegate=new Set<string>([
 "/tpo/batches","/tpo/batches/[batchId]",
 "/tpo/batches/[batchId]/classes","/tpo/batches/[batchId]/history",
 "/tpo/batches/[batchId]/registrations",
 "/tpo/batches/[batchId]/registrations/[membershipId]/history",
 "/tpo/batches/[batchId]/rules","/tpo/batches/[batchId]/students",
]);
const pageSource=(route:string)=>readFileSync(resolve(process.cwd(),
 "src/app/(authenticated)"+route+"/page.tsx"),"utf8");
describe("UX-tpo-first-third-42 route scope and navigation inventory",()=>{
 it("defines exactly the 42 first-third pages without repeated cases",()=>{
  expect(pages.length).toBe(42);
  expect(new Set(pages).size).toBe(pages.length);
 });
 for(const route of pages){
  it(`UX-${route}: role/redirect boundary does not open private records before scope`,()=>{
   const source=pageSource(route);
   if(alias.has(route)){
    expect(source).toMatch(/redirect\(/);
    expect(source).not.toContain("getDb()");
    expect(source).not.toContain("recordActivityEvent");
    expect(source).not.toContain("getCurrentRequestContext");
    return;
   }
   expect(source).toContain("getCurrentRequestContext");
   if(delegate.has(route)){
    // All batch reads delegate to requireTpoBatchActor (persisted actor,
    // active membership, tenant/org and role) in the workspace services.
    expect(source).toMatch(/(?:getTpoBatch|listTpoBatch|listTpoBatches|getTpoLearnerRegistrationHistory)\w*\(/);
   }else if(route==="/tpo/home"){
    expect(source).toContain("hasTpoTooling(ctx)");
   }else{
    const explicit=/hasMembershipRole\([\s\S]{0,80}["']TPO["']\)|can\(context,\s*["']placements\.manage["']/.test(source);
    const operationsGate=/requireTpo\w*\(|getPlacementTpoOperations\(/.test(source);
    expect(explicit||operationsGate).toBe(true);
   }
  });
 }
});
