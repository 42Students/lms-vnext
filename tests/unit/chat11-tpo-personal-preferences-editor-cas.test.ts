import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {TPO_NOTIFICATION_PREFERENCE_FIELDS,TPO_NOTIFICATION_PREFERENCE_DEFAULTS}
 from "@/modules/placements/tpo-my-notifications-model";
import {tpoNotificationPreferenceSaveSchema,tpoNotificationPreferencesMatch}
 from "@/modules/placements/tpo-my-notification-preferences-model";

describe("TPO-settings-audit-PREF-UI-06 user-scoped notification preferences",()=>{
 it("shows exactly the five typed controls and rejects forged user/college fields",()=>{
  expect(TPO_NOTIFICATION_PREFERENCE_FIELDS.map(item=>item.key)).toEqual([
   "morningDigest","recruiterMessages","requests","resultsReady","followUps",
  ]);
  const first={...TPO_NOTIFICATION_PREFERENCE_DEFAULTS,expectedVersion:null};
  expect(tpoNotificationPreferenceSaveSchema.safeParse(first).success).toBe(true);
  for(const extra of [{userId:"forged"},{collegeId:"foreign"},{email:"wrong@example.com"}])
   expect(tpoNotificationPreferenceSaveSchema.safeParse({...first,...extra}).success).toBe(false);
  expect(tpoNotificationPreferencesMatch(first,first)).toBe(true);
  expect(tpoNotificationPreferencesMatch(first,{...first,followUps:false})).toBe(false);
 });
 it("tracks last saved values and advances persisted CAS after success rather than rendering stale dirty state",()=>{
  const component=readFileSync("src/components/tpo/tpo-my-notification-preferences-editor.tsx","utf8");
  const route=readFileSync("src/app/api/placements/tpo/my-notification-preferences/route.ts","utf8");
  const service=readFileSync("src/modules/placements/tpo-my-notification-preferences-write.ts","utf8");
  expect(component).toContain("const [saved,setSaved]=useState<TpoNotificationPreferences>(initial)");
  expect(component).toContain("const [currentVersion,setCurrentVersion]=useState(version)");
  expect(component).toContain("value[field.key]!==saved[field.key]");
  expect(component).toContain("if((!dirty&&currentVersion!==null)||saving.current)return");
  expect(component).toContain("expectedVersion:currentVersion");
  expect(component).toContain("setCurrentVersion(result.version)");
  expect(component).toContain("setSaved({...value})");
  expect(component).toContain("finally{saving.current=false;setBusy(false);}");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("readTpoSettingsBody(request)");
  expect(service).toContain('hasMembershipRole(persisted,"TPO")');
  expect(service).toContain("tpoNotificationPreferencesMatch(current,values)");
  expect(service.indexOf("tpoNotificationPreferencesMatch(current,values)"))
   .toBeLessThan(service.indexOf('new TpoPreferenceSaveError("STALE")'));
 });
});
