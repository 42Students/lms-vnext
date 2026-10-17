import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {companySharePreferenceKey,parseCompanyShareExpiry} from "@/modules/placements/company-share/remembered-settings-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO-drive-workspace-66 remembered company share settings",()=>{
 it("TPO-drive-workspace-66 scopes remembered settings to exact college and company",()=>{
  expect(companySharePreferenceKey("college-a","company-a")).not.toBe(companySharePreferenceKey("college-b","company-a"));
  expect(companySharePreferenceKey("college-a","company-a")).not.toBe(companySharePreferenceKey("college-a","company-b"));
 });
 it("TPO-drive-workspace-66 limits stored settings to expiry only",()=>{
  const key=companySharePreferenceKey("c","r");
  expect(key).toContain("company-share-expiry");
  expect(key).not.toContain("token");
  const form=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx");
  expect(form).toContain("window.localStorage.setItem(preferenceKey,String(safe))");
  expect(form).not.toContain("localStorage.setItem(preferenceKey,newUrl)");
 });
 it("TPO-drive-workspace-66 recovers a valid remembered expiry",()=>{
  for(let n=1;n<=7;n++)expect(parseCompanyShareExpiry(String(n))).toBe(n);
 });
 it("TPO-drive-workspace-66 rejects a forged or stale expiry",()=>{
  for(const value of ["0","8","-1","1.2","NaN","9999","2 days",null,{},0])
   expect(parseCompanyShareExpiry(value)).toBe(2);
 });
 it("TPO-drive-workspace-66 remembers preferences across refreshes without SSR hydration drift",()=>{
  const form=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx");
  expect(form).toContain("useSyncExternalStore(subscribe,snapshot,()=>2)");
  expect(form).toContain('window.addEventListener("storage",changed)');
  expect(form).toContain("window.dispatchEvent(new Event");
 });
 it("TPO-drive-workspace-66 derives preference key only from authorized persisted job scope",()=>{
  const page=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx");
  const scope=read("src/modules/placements/tpo-shareable-shortlist-service.ts");
  expect(scope).toContain("companyRelationshipId:placementJobs.companyRelationshipId");
  expect(scope).toContain("eq(placementJobs.collegeId, college.id)");
  expect(page).toContain("companySharePreferenceKey(data.job.collegeId,data.job.companyRelationshipId)");
 });
});
