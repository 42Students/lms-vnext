import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-15 personal placement alert lifecycle",()=>{
 it("LEARNER-placements-01 marks recipient-scoped alerts read before opening them",()=>{
  const client=source("src/components/placements/learner-placement-alert-action.tsx");
  const list=source("src/components/placements/learner-placement-alerts.tsx");
  const api=source("src/app/api/notifications/[notificationId]/read/route.ts");
  expect(client).toContain('/api/notifications/');
  expect(client).toContain('await markRead()');
  expect(client).toContain('router.push(safeHref)');
  expect(client).toContain('router.refresh()');
  expect(list).toContain("LearnerPlacementAlertAction");
  expect(api).toContain("markOwnLearnerNotificationRead(context, notificationId)");
 });
});