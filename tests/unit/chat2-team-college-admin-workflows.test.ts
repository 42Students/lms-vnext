import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO placement team admin parity",()=>{
 it("TPO-inbox-team-38 requires active college role and scoped persisted permission for message writes",()=>{
  const create=src("src/modules/placements/tpo-team-internal-create-service.ts");
  const reply=src("src/modules/placements/tpo-team-internal-reply-service.ts");
  const ask=src("src/modules/placements/tpo-team-asks-service.ts");
  const read=src("src/modules/placements/tpo-team-conversation-service.ts");
  for(const file of [create,reply,ask,read])
   expect(file).toContain("hasPlacementTeamMembership(context)");
  expect(create).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(reply).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(create).toContain('assertPersistedPlatformPermission(tx,context');
 });
 it("TPO-inbox-team-R02 includes college administrators on Everyone messages, read and bell",()=>{
  const all=src("src/modules/placements/tpo-team-everyone-service.ts");
  expect(all).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(all).toContain("hasPlacementTeamMembership(context)");
  expect(all).toContain("everyoneNotificationRecipients");
  const forms=src("src/components/tpo/tpo-team-forms.tsx");
  expect(forms).toContain("Choose an active placement team colleague");
 });
});
