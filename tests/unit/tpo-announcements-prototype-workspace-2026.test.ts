import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(file:string)=>readFileSync(file,"utf8");
describe("TPO Students / Announcements prototype",()=>{
 it("keeps original notice ownership, targeting and mutation controls when showing a selected detail",()=>{
  const page=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(page).toContain("requirePersistedTpoMembership");
  expect(page).toContain("listTpoPlacementAnnouncements(context");
  expect(page).toContain("TpoNoticeAudiencePicker");
  expect(page).toContain("TpoNoticeLiveReach");
  expect(page).toContain("TpoNoticeDeleteConfirm");
  expect(page).toContain("TpoNoticeReadProgress");
  expect(page).toContain("TpoNoticeUndoToast");
  expect(page).toContain("TpoNoticeDeliveryRetry");
  expect(page).toContain("noticeCanUndo(row,new Date())");
  expect(page).toContain('data-testid="tpo.announcements.prototype-workspace"');
  expect(page).toContain("<TpoNoticePrototypeSidebar");
  expect(page).toContain("{[selectedNotice].map(row=>");
 });
 it("does not substitute the first notice if the selected ID is absent from the authorized page",()=>{
  const page=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(page).toContain("result.items.find(row=>row.id===raw.notice)??null");
  expect(page).toContain("The selected announcement is not on this page. No other notice was opened.");
  expect(page).toContain('scalarKeys=["tab","page","mine","audience","targetId","notice","compose"]');
 });
 it("keeps the prototype sidebar local to the loaded page and filters by actual notice metadata",()=>{
  const sidebar=source("src/components/tpo/tpo-notice-prototype-sidebar.tsx");
  expect(sidebar).toContain("new Date(nowIso).getTime()");
  expect(sidebar).toContain('const groups=["GOING OUT LATER","SHOWING NOW","ENDED"]');
  expect(sidebar).toContain('placeholder="Search announcements on this page"');
  expect(sidebar).toContain("row.title,row.senderName??");
  expect(sidebar).toContain("params.set(\"notice\",id)");
  expect(sidebar).toContain("Older items may be on later pages.");
  expect(sidebar).not.toContain("58 of 64");
 });
 it("opens the real notice composer on user-requested New announcement, not an automatic send",()=>{
  const page=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  const sidebar=source("src/components/tpo/tpo-notice-prototype-sidebar.tsx");
  expect(page).toContain('initialOpen={raw.compose==="1"||Boolean(');
  expect(sidebar).toContain('href="/tpo/announcements?tab=yours&compose=1"');
  expect(page).toContain('action="/api/placements/tpo/announcements"');
 });
});
