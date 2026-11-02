import {describe,expect,it} from "vitest";
import {createTenantChoicePromiseCache} from "@/modules/placements/tpo-after-college-model";
import {publishedDriveRecipientScopeDescription} from "@/modules/placements/tpo-drive-publish-effects";

const COLLEGE_A="3f07e954-a74c-59f2-9d82-263343b1c1a9";
const COLLEGE_B="3027c935-2367-5706-94c4-2e71ab2ac0ca";

describe("PHASE2-CACHE tenant choice promise cache",()=>{
 it("PHASE2-CACHE-01 concurrent callers for the same tenant, scope and revision share one read",async()=>{
  const cache=createTenantChoicePromiseCache<string>();
  let reads=0;
  const reader=async()=>{reads++;return "choices";};
  const [a,b,c]=await Promise.all([
   cache.load(COLLEGE_A,"TPO",1,reader),cache.load(COLLEGE_A,"TPO",1,reader),cache.load(COLLEGE_A,"TPO",1,reader),
  ]);
  expect([a,b,c]).toEqual(["choices","choices","choices"]);
  expect(reads).toBe(1);
 });

 it("PHASE2-CACHE-02 a different tenant never receives another tenant's cached choices",async()=>{
  const cache=createTenantChoicePromiseCache<string>();
  const a=await cache.load(COLLEGE_A,"TPO",1,async()=>"college-a");
  const b=await cache.load(COLLEGE_B,"TPO",1,async()=>"college-b");
  expect(a).toBe("college-a");
  expect(b).toBe("college-b");
 });

 it("PHASE2-CACHE-03 scope and revision are part of the key, so a revision bump re-reads",async()=>{
  const cache=createTenantChoicePromiseCache<number>();
  let n=0;
  const reader=async()=>++n;
  expect(await cache.load(COLLEGE_A,"TPO",1,reader)).toBe(1);
  expect(await cache.load(COLLEGE_A,"TPO",1,reader)).toBe(1);
  expect(await cache.load(COLLEGE_A,"TPO",2,reader)).toBe(2);
  expect(await cache.load(COLLEGE_A,"HR",1,reader)).toBe(3);
  expect(await cache.load(COLLEGE_A,"TPO","1",reader)).toBe(1);
 });

 it("PHASE2-CACHE-04 a failed read is not cached: the next caller retries and can succeed",async()=>{
  const cache=createTenantChoicePromiseCache<string>();
  let attempt=0;
  const reader=async()=>{if(++attempt===1)throw new Error("database unavailable");return "recovered";};
  await expect(cache.load(COLLEGE_A,"TPO",1,reader)).rejects.toThrow("database unavailable");
  expect(await cache.load(COLLEGE_A,"TPO",1,reader)).toBe("recovered");
  expect(attempt).toBe(2);
 });

 it("PHASE2-CACHE-05 a synchronous reader throw is also a rejection and is not cached",async()=>{
  const cache=createTenantChoicePromiseCache<string>();
  let attempt=0;
  const reader=(()=>{if(++attempt===1)throw new Error("boom");return Promise.resolve("ok");}) as ()=>Promise<string>;
  await expect(cache.load(COLLEGE_A,"TPO",1,reader)).rejects.toThrow("boom");
  expect(await cache.load(COLLEGE_A,"TPO",1,reader)).toBe("ok");
 });

 it("PHASE2-CACHE-06 invalidate(tenant) drops only that tenant; invalidate() drops everything",async()=>{
  const cache=createTenantChoicePromiseCache<number>();
  let n=0;
  const reader=async()=>++n;
  await cache.load(COLLEGE_A,"TPO",1,reader);
  await cache.load(COLLEGE_B,"TPO",1,reader);
  expect(n).toBe(2);
  cache.invalidate(COLLEGE_A);
  expect(await cache.load(COLLEGE_B,"TPO",1,reader)).toBe(2);
  expect(await cache.load(COLLEGE_A,"TPO",1,reader)).toBe(3);
  cache.invalidate();
  expect(await cache.load(COLLEGE_B,"TPO",1,reader)).toBe(4);
  expect(await cache.load(COLLEGE_A,"TPO",1,reader)).toBe(5);
 });

 it("PHASE2-CACHE-07 malformed tenant ids and scopes are rejected before any read",()=>{
  const cache=createTenantChoicePromiseCache<string>();
  let reads=0;
  const reader=async()=>{reads++;return "x";};
  expect(()=>cache.load("not-a-uuid","TPO",1,reader)).toThrow();
  expect(()=>cache.load("","TPO",1,reader)).toThrow();
  expect(()=>cache.load(COLLEGE_A,"",1,reader)).toThrow();
  expect(()=>cache.load(COLLEGE_A," ",1,reader)).toThrow();
  expect(()=>cache.load(COLLEGE_A,"s".repeat(129),1,reader)).toThrow();
  expect(()=>cache.invalidate("not-a-uuid")).toThrow();
  expect(reads).toBe(0);
 });

 it("PHASE2-CACHE-08 the scope is trimmed so padded and plain scopes share an entry",async()=>{
  const cache=createTenantChoicePromiseCache<number>();
  let n=0;
  const reader=async()=>++n;
  expect(await cache.load(COLLEGE_A,"TPO",1,reader)).toBe(1);
  expect(await cache.load(COLLEGE_A,"  TPO  ",1,reader)).toBe(1);
 });
});

describe("PHASE2-PUBLISH published drive recipient scope description",()=>{
 it("PHASE2-PUBLISH-01 states the audience is eligible, opted-in, registered, tenant-scoped learners",()=>{
  const text=publishedDriveRecipientScopeDescription();
  for(const phrase of ["Eligible","opted-in","active PLACEMENTS registrations","tenant-scoped","applicable job policy"])
   expect(text,phrase).toContain(phrase);
 });

 it("PHASE2-PUBLISH-02 promises no notification to an unknown audience and is stable text",()=>{
  const text=publishedDriveRecipientScopeDescription();
  expect(text).toContain("No notification is sent to an unknown audience.");
  expect(publishedDriveRecipientScopeDescription()).toBe(text);
  expect(text.endsWith(".")).toBe(true);
 });
});
