import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("UX-G159 team interaction recovery contracts",()=>{
 it("rejects invalid and past IST away dates before mutation",()=>{
  const ui=source("src/components/tpo/tpo-team-away-form.tsx");
  expect(ui).toContain('date+"+05:30"');
  expect(ui).toContain('parsed.getTime()<=Date.now()');
  expect(ui).toContain('Past away periods cannot be saved.');
  expect(ui).toContain('setDate("");setNotice');
  expect(ui).toContain('role="alert"');
  expect(ui).toContain('expectedUntil:until');
 });
 it("preserves the rename draft and gives explicit 409/403 recovery",()=>{
  const ui=source("src/components/tpo/tpo-team-rename.tsx");
  expect(ui).toContain('reason instanceof FriendlyFetchError&&reason.status===409');
  expect(ui).toContain('reason instanceof FriendlyFetchError&&reason.status===403');
  expect(ui).toContain('Your draft is kept');
  expect(ui).toContain('expectedTopic:currentTopic');
  expect(ui).toContain('disabled={busy} onClick');
 });
 it("retains version-checked message edit and delete under permission guards",()=>{
  const ui=source("src/components/tpo/tpo-team-message-actions.tsx");
  expect(ui).toContain('expectedBodyHash');
  expect(ui).toContain('mode==="DELETE"');
  expect(ui).toContain('role="alertdialog"');
  expect(ui).toContain('reason instanceof FriendlyFetchError&&reason.status===409');
  expect(ui).toContain('reason instanceof FriendlyFetchError&&reason.status===403');
  expect(ui).toContain('Your draft remains available');
 });
 it("uses exact first-page membership for the nudge select-all state",()=>{
  const ui=source("src/components/tpo/tpo-student-nudge-panel.tsx");
  expect(ui).toContain("const firstPageIds=rows.slice(0,25).map(row=>row.id)");
  expect(ui).toContain("firstPageIds.every(id=>validSelected.includes(id))");
  expect(ui).toContain("checked={firstPageSelected}");
  expect(ui).toContain("disabled={pending||guardedPending}");
 });
 it("cannot render the synthetic fixture in production",()=>{
  const ui=source("src/app/e2e/ux-g159-fixture/page.tsx");
  expect(ui).toContain('process.env.NODE_ENV!=="development"');
  expect(ui).toContain('process.env.UX_G159_FIXTURE!=="1"');
  expect(ui).toContain('notFound()');
 });
});
