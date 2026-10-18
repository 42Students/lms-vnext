import {readFileSync} from "node:fs";
import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import {
 collegeBrandingSaveSchema,sameCollegeBranding,type CollegeBrandingInput,
} from "@/modules/colleges/branding";

const mocks=vi.hoisted(()=>({origin:vi.fn(),context:vi.fn(),save:vi.fn(),read:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.error}));
vi.mock("@/modules/colleges/branding-service",()=>{
 class CollegeBrandingNotFoundError extends Error{}
 class CollegeBrandingVersionError extends Error{}
 return {
  CollegeBrandingNotFoundError,CollegeBrandingVersionError,
  getCollegeBranding:mocks.read,saveCollegeBranding:mocks.save,
 };
});
import {GET,PUT} from "@/app/api/colleges/[collegeId]/branding/route";
import {CollegeBrandingVersionError} from "@/modules/colleges/branding-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const actor={user:{id:"real-admin"},membership:null};
const params={params:Promise.resolve({collegeId})};
const original:CollegeBrandingInput={
 logoUrl:"https://cdn.example.edu/logo.png",faviconUrl:null,
 loginBackgroundUrl:null,loginBackgroundUrlMobile:null,
 primaryColor:"#1A95A1",secondaryColor:null,supportEmail:null,
 supportPhone:null,termsUrl:null,privacyUrl:null,
};
const payload={...original,expectedVersion:3};
const req=(value:string,type="application/json")=>new Request(
 "https://example.edu/api/colleges/"+collegeId+"/branding",{
 method:"PUT",headers:{"content-type":type},body:value,
});

beforeEach(()=>{
 for(const mock of Object.values(mocks))mock.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue(actor);
 mocks.save.mockResolvedValue({collegeName:"Test",...original,version:4});
 mocks.read.mockResolvedValue({collegeName:"Test",...original,version:4});
 mocks.error.mockImplementation(()=>NextResponse.json({error:"DENIED"},{status:403}));
});

describe("SA-tenants-modules-BRAND-CAS-01 optimistic college branding saves",()=>{
 it("requires a typed version, forbids identity injection and compares exact normalized fields",()=>{
  expect(collegeBrandingSaveSchema.safeParse(payload).success).toBe(true);
  for(const raw of [
   original,{...payload,expectedVersion:-1},{...payload,expectedVersion:1.2},
   {...payload,expectedVersion:"3"},{...payload,collegeId:"other"},
   {...payload,actorUserId:"forged"},
  ])expect(collegeBrandingSaveSchema.safeParse(raw).success).toBe(false);
  expect(sameCollegeBranding(original,{...original})).toBe(true);
  expect(sameCollegeBranding(original,{...original,primaryColor:"#AABBCC"})).toBe(false);
  expect(sameCollegeBranding(original,{...original,logoUrl:null})).toBe(false);
 });
 it("GET is read-only, authenticated and returns scoped, versioned persisted details",async()=>{
  const response=await GET(new Request("https://example.edu/api/colleges/"+collegeId+"/branding"),params);
  expect(response.status).toBe(200);
  expect((await response.json()).branding.version).toBe(4);
  expect(mocks.read).toHaveBeenCalledWith(actor,collegeId);
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("GET refuses an expired session without reading the college record or writing",async()=>{
  mocks.context.mockRejectedValueOnce(new Error("expired session"));
  const response=await GET(new Request("https://example.edu/api/colleges/"+collegeId+"/branding"),params);
  expect(response.status).toBe(403);
  expect(mocks.read).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
 });

 it("rejects cross-origin writes before authentication or parsing",async()=>{
  mocks.origin.mockReturnValueOnce(false);
  const result=await PUT(req(JSON.stringify(payload)),params);
  expect(result.status).toBe(403);
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("uses authenticated context, preserves version and never echoes a forged user ID",async()=>{
  const result=await PUT(req(JSON.stringify(payload)),params);
  expect(result.status).toBe(200);
  expect(result.headers.get("cache-control")).toBe("private, no-store");
  expect(mocks.save).toHaveBeenCalledWith(actor,collegeId,payload);
  expect((await result.json()).branding.version).toBe(4);
 });
 it("returns a safe conflict for genuinely different stale changes",async()=>{
  mocks.save.mockRejectedValueOnce(new CollegeBrandingVersionError());
  const result=await PUT(req(JSON.stringify(payload)),params);
  expect(result.status).toBe(409);
  expect(await result.json()).toEqual({error:"BRANDING_STALE"});
 });
 it("rejects JSON over 16KiB, malformed JSON and wrong media types before service mutation",async()=>{
  for(const [body,type,status] of [
   ["{invalid","application/json",400],
   ["x".repeat(17*1024),"application/json",413],
   ["{}","text/plain",400],
  ] as const){
   const result=await PUT(req(body,type),params);
   expect(result.status).toBe(status);
   expect(await result.json()).toEqual({error:"INVALID_REQUEST"});
  }
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("keeps actor/college locks, benign retries and same-transaction activity ordering",()=>{
  const src=readFileSync("src/modules/colleges/branding-service.ts","utf8");
  const start=src.indexOf("export async function saveCollegeBranding(");
  const part=src.slice(start);
  const authorize=part.indexOf('assertPersistedPlatformPermission(tx,context,"college.manage"');
  const collegeLock=part.indexOf('.for("update")');
  const stored=part.indexOf("const [stored]=await tx.select()");
  const identical=part.indexOf("if(sameCollegeBranding(previous,input))");
  const cas=part.indexOf("if(previous.version!==expectedVersion)");
  const update=part.indexOf("tx.update(collegeBranding)");
  const activity=part.indexOf("recordActivityEventInTransaction(tx, context");
  expect(authorize).toBeGreaterThan(0);
  expect(collegeLock).toBeGreaterThan(authorize);
  expect(stored).toBeGreaterThan(collegeLock);
  expect(identical).toBeGreaterThan(stored);
  expect(cas).toBeGreaterThan(identical);
  expect(update).toBeGreaterThan(cas);
  expect(activity).toBeGreaterThan(update);
  const form=readFileSync("src/components/admin/college-branding-form.tsx","utf8");
  expect(form).toContain("JSON.stringify({...clean(values),expectedVersion:version})");
  expect(form).toContain("setVersion(data.branding.version)");
  expect(form).toContain("Your edits are preserved.");
  for(const page of [
   "src/app/(authenticated)/college/branding/page.tsx",
   "src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx",
  ])expect(readFileSync(page,"utf8")).toContain("initialVersion={");
 });
});
