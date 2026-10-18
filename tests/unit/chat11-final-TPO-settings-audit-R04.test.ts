import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 tpoAuditSavedFiltersSchema,tpoAuditSavedViewCommandSchema,
 tpoAuditSavedViewHref,tpoAuditStoredView,
} from "@/modules/placements/tpo-audit-saved-view-model";
const read=(path:string)=>readFileSync(path,"utf8");
const id="11111111-1111-4111-8111-111111111111";
const filters={kind:"ALL",from:"",to:"",q:"candidate",who:"officer"};

describe("TPO-settings-audit-R04 persisted audit saved views across devices",()=>{
 it("TPO-settings-audit-R04 accepts only strict private filter and operation contracts",()=>{
  expect(tpoAuditSavedFiltersSchema.safeParse(filters).success).toBe(true);
  expect(tpoAuditSavedViewCommandSchema.safeParse({
   action:"CREATE",name:"Audit list",filters,
  }).success).toBe(true);
  for(const bad of [
   {action:"CREATE",name:"Audit list",filters,collegeId:id},
   {action:"CREATE",name:"Audit list",filters:{...filters,userId:id}},
   {action:"CREATE",name:"Audit list",filters:{...filters,from:"2026-10-31",to:"2026-10-01"}},
   {action:"CREATE",name:"Audit list",filters:{...filters,kind:"DRIVE"}},
   {action:"CREATE",name:"Audit list",filters:{...filters,from:"2026-02-30"}},
   {action:"CREATE",name:"",filters},
   {action:"PIN",id,pinned:true},
   {action:"DELETE",id,expectedRevision:"not-a-uuid"},
   {action:"DROP_ALL"},
  ])expect(tpoAuditSavedViewCommandSchema.safeParse(bad).success).toBe(false);
 });
 it("TPO-settings-audit-R04 preserves private pinned and last-use metadata without trusting arbitrary JSON",()=>{
  const parsed=tpoAuditStoredView({query:filters,pinned:true,usedAt:"2099-01-01T00:00:00.000Z",revision:id});
  expect(parsed).toEqual({query:filters,pinned:true,usedAt:"2099-01-01T00:00:00.000Z",revision:id});
  expect(tpoAuditStoredView({query:{...filters,organizationId:id},pinned:true})).toBeNull();
  expect(tpoAuditStoredView({query:filters,pinned:false,usedAt:"bad"})).toMatchObject({usedAt:null,revision:null});
  const href=tpoAuditSavedViewHref({...filters,kind:"OFFER",who:"A & B"});
  const query=new URL(href,"https://college.example").searchParams;
  expect(query.get("who")).toBe("A & B");
  expect(query.get("kind")).toBe("OFFER");
  expect(href).toMatch(/^\/tpo\/audit\?/);
 });
 it("TPO-settings-audit-R04 persists scope AUDIT by actor and college with live permissions, caps and CAS",()=>{
  const service=read("src/modules/placements/tpo-audit-saved-view-service.ts");
  const schema=read("src/db/schema/tpo-collaboration.ts");
  expect(schema).toContain('"placement_tpo_saved_views"');
  expect(schema).toContain("'AUDIT'");
  expect(service).toContain("eq(placementTpoSavedViews.collegeId,collegeId)");
  expect(service).toContain("eq(placementTpoSavedViews.userId,userId)");
  expect(service).toContain('eq(placementTpoSavedViews.scope,"AUDIT")');
  expect(service).toContain('hasMembershipRole(persisted,"TPO")');
  expect(service).toContain("assertPersistedPlatformPermission(tx,ctx");
  expect(service).toContain('.for("update").limit(1)');
  expect(service).toContain("rows.length>=12");
  expect(service).toContain("length>=5");
  expect(service).toContain("existing.stored.revision!==input.expectedRevision");
  expect(service).toContain("await tx.insert(activityEvents)");
  expect(service).toContain('input.action==="OPEN"');
  expect(service).toContain("usedAt:new Date().toISOString()");
 });
 it("TPO-settings-audit-R04 uses signed-in server-backed views and never a browser-only shared cache",()=>{
  const ui=read("src/components/tpo/tpo-audit-saved-views.tsx");
  const page=read("src/app/(authenticated)/tpo/audit/page.tsx");
  const route=read("src/app/api/placements/tpo/audit/saved-views/route.ts");
  expect(page).toContain("<TpoAuditSavedViews");
  expect(page).not.toContain("<TpoAuditSavedViews collegeId=");
  expect(ui).toContain("await apiFetch<MutationResult>(endpoint");
  expect(ui).toContain("await load()");
  expect(ui).toContain("tpoAuditSavedViewHref(result.filters)");
  expect(ui).toContain("Maximum five pinned audit views.");
  expect(ui).toContain("Maximum 12 saved audit views.");
  expect(ui).toContain("Saved view renamed.");
  expect(ui).toContain("Delete this saved audit view?");
  expect(ui).toContain("The result of this change is uncertain.");
  expect(ui).not.toContain("localStorage");
  expect(ui).toContain("sync across your signed-in devices");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("readTpoSettingsBody(request)");
  expect(route).toContain("private, no-store");
 });
});
