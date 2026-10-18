import {afterEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {readTpoBulkRequestBody,TPO_BULK_BODY_MAX_BYTES} from "@/modules/placements/tpo-bulk-request-body";
import {tpoWaitlistPromotionSchema,waitlistPreviewToken} from "@/modules/placements/tpo-waitlist-promotion-model";
import {recordSelectionsSchema,releaseSelectionsSchema} from "@/modules/placements/tpo-drive-selection-model";

const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const uuid="11111111-1111-4111-8111-111111111111";
const basic={action:"RECORD",entries:[{applicationId:uuid,roleTitle:"Software engineer",annualCtcInr:null}]};
const release={action:"VERIFY_AND_RELEASE",confirmed:true,selectionIds:[uuid],expectedRecordedAt:{[uuid]:"2099-10-18T10:00:00+05:30"}};
afterEach(()=>vi.unstubAllGlobals());

describe("TPO-BREAK-input-01 and TPO-BREAK-transport-01",()=>{
 it("TPO-BREAK-input-01 refuses malformed selection IDs, duplicate candidates and forged college",()=>{
  for(const input of [{...basic,entries:[...basic.entries,...basic.entries]}, {...basic,collegeId:uuid},
   {...basic,entries:[{...basic.entries[0],applicationId:"../../../admin"}]}]){
    expect(recordSelectionsSchema.safeParse(input).success).toBe(false);
  }
  expect(recordSelectionsSchema.safeParse(basic).success).toBe(true);
  expect(releaseSelectionsSchema.safeParse({...release,confirmed:false}).success).toBe(false);
  expect(releaseSelectionsSchema.safeParse({...release,expectedRecordedAt:{}}).success).toBe(false);
 });
 it("TPO-BREAK-transport-01 refuses JSON primitive and oversized streaming before any mutation",async()=>{
  const body=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new TextEncoder().encode("[]"));controller.close();}});
  const bad=new Request("http://localhost/api/placements/tpo/bulk-actions/confirm",{
   method:"POST",headers:{"content-type":"application/json"},body,duplex:"half",
  } as RequestInit & {duplex:"half"});
  await expect(readTpoBulkRequestBody(bad)).rejects.toMatchObject({status:400});
  const over=new Request("http://localhost/api/placements/tpo/bulk-actions/confirm",{
   method:"POST",headers:{"content-type":"application/json","content-length":String(TPO_BULK_BODY_MAX_BYTES+1)},
   body:"{}",});
  await expect(readTpoBulkRequestBody(over)).rejects.toMatchObject({status:413});
 });
});

describe("TPO-BREAK-session-01 / TPO-BREAK-tenant-01",()=>{
 it.each([
  [401,"Your session has ended. Please sign in again."],
  [403,"You do not have permission to do this. Please contact your administrator if needed."],
  [409,"This changed while you were working. Refresh and try again."],
  [500,"Something went wrong on our side. Please try again in a moment."],
 ] as const)("TPO-BREAK-session-01 maps %i to an actionable message without leaking internal errors",async(status,message)=>{
  vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify({error:"SECRETS_INTERNAL_SQL_DATABASE_TRACE",message:"SELECT * FROM user_sessions"}),{
   status,headers:{"Content-Type":"application/json"},
  })));
  await expect(apiFetch("/api/placements/tpo/jobs", {method:"GET",timeoutMs:1000})).rejects.toMatchObject({message,status});
  expect(message).not.toContain("SECRETS_INTERNAL");
 });
 it("TPO-BREAK-tenant-01 checks persisted role, membership and college before job writes",()=>{
  const guard=source("src/modules/placements/tpo-job-write-base.ts");
  for(const clause of ['hasMembershipRole(context,"TPO")','hasMembershipRole(context,"COLLEGE_ADMIN")',
   'member.status!=="ACTIVE"','context.user.platformStatus!=="ACTIVE"',
   'can(context,"placements.manage",{collegeId})',
   'requirePlacementManageScope(context,collegeId)',
   'eq(collegeMemberships.userId,context.user.id)',
   'eq(collegeMemberships.collegeId,member.collegeId)',
   'eq(users.platformStatus,"ACTIVE")'])
   expect(guard).toContain(clause);
 });
 it("PLACEMENTS-TPO-REVOKE-RACE-02 keeps the user's current persisted TPO grant locked throughout destructive transactions",()=>{
  const guard=source("src/modules/placements/tpo-job-write-base.ts");
  const actor=guard.slice(guard.indexOf("export async function requireTpoJobActor"),guard.indexOf("export async function auditTpoJobChange"));
  expect(actor).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(actor).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(actor).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(actor).toContain('.for("share").limit(1)');
  const lifecycle=source("src/modules/placements/tpo-offer-lifecycle-service.ts");
  expect(lifecycle).toContain('await requireTpoJobActor(tx,context);');
  expect(lifecycle.indexOf("await requireTpoJobActor(tx,context)"))
    .toBeLessThan(lifecycle.indexOf("const scoped = await tx.select"));
 });
 it("TPO-BREAK-origin-01 verifies same-origin, context and matching-row versions on both batch import writes",()=>{
  const preview=source("src/app/api/placements/tpo/batches/[batchId]/import-preview/route.ts");
  const commit=source("src/app/api/placements/tpo/batches/[batchId]/import-commit/route.ts");
  for(const route of [preview,commit]){
   expect(route).toContain("isSameOriginRequest(request)");
   expect(route).toContain("getCurrentRequestContext()");
   expect(route).toContain("apiErrorResponse(error)");
  }
  expect(commit).toContain("previewMemberIds");
  expect(commit).toContain("candidate.membershipId!==body.previewMemberIds[index]");
  expect(commit).toContain("version!==candidate.expectedVersion");
  expect(commit).toContain('confirmed:z.literal(true)');
  expect(commit).toContain(".max(5000)");
 });
});

describe("TPO-BREAK-race-01 and TPO-BREAK-stale-01",()=>{
 it("TPO-BREAK-race-01 uses synchronous lock before network work and releases it on all exits",()=>{
  const ui=source("src/components/tpo/tpo-batch-eligibility-import.tsx");
  const preview=ui.slice(ui.indexOf("async function previewChanges"),ui.indexOf("async function copyPreview"));
  const confirm=ui.slice(ui.indexOf("async function commit"),ui.indexOf("return <section"));
  for(const fn of [preview,confirm]){
   expect(fn).toContain("actionInFlight.current=true;setBusy(true)");
   expect(fn).toContain("actionInFlight.current=false;setBusy(false)");
   expect(fn.indexOf("actionInFlight.current=true")).toBeLessThan(fn.indexOf("apiFetch<"));
  }
  expect(preview).toContain("if(busy||actionInFlight.current)return");
  expect(confirm).toContain("if(!preview||preview.ready===0||busy||actionInFlight.current||!acknowledged)return");
  expect(confirm).toContain("previewMemberIds:");
  expect(confirm).toContain("expectedVersions:versions");
  expect(confirm).toContain("preview it again");
 });
 it("TPO-BREAK-stale-01 prevents preview replay for a different job or changed waitlist",()=>{
  const first=waitlistPreviewToken(uuid,{round:"final",status:"APPLIED",rank:1,seat:2});
  expect(first).not.toBe(waitlistPreviewToken(uuid,{round:"final",status:"APPLIED",rank:2,seat:2}));
  expect(first).not.toBe(waitlistPreviewToken("22222222-2222-4222-8222-222222222222",{round:"final",status:"APPLIED",rank:1,seat:2}));
  expect(tpoWaitlistPromotionSchema.safeParse({
   action:"OFFER_NEXT",expectedPreviewToken:first,confirmed:true,
   reason:"Next qualified candidate in the recorded waitlist",
  }).success).toBe(true);
  const service=source("src/modules/placements/tpo-waitlist-promotion-service.ts");
  expect(service).toContain('input.expectedPreviewToken!==preview.previewToken');
  expect(service).toContain('.for("update")');
  expect(service).toContain('eq(collegeMemberships.collegeId,collegeId)');
  expect(service).toContain("auditTpoJobChange");
 });
 it("TPO-BREAK-error-01 fails closed on unexpected errors rather than exposing provider stack",()=>{
  const ui=source("src/components/tpo/tpo-batch-eligibility-import.tsx");
  expect(ui).toContain("e instanceof FriendlyFetchError?e.message:friendlyApiError({})");
  expect(friendlyApiError({status:401})).not.toContain("code");
  expect(friendlyApiError({status:500,code:"POSTGRES_CONNECTION_TIMEOUT"})).not.toContain("POSTGRES");
 });
});
