import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");

describe("UX-G158 TPO notice interaction contracts",()=>{
 it("keeps stale and forbidden delete failures in an accessible confirmation",()=>{
  const ui=source("src/components/tpo/tpo-notice-delete-confirm.tsx");
  expect(ui).toContain('role="alertdialog"');
  expect(ui).toContain('role="alert"');
  expect(ui).toContain('response.status===409');
  expect(ui).toContain('response.status===403');
  expect(ui).toContain('headers:{Accept:"application/json"}');
  expect(ui).toContain('credentials:"same-origin"');
  expect(ui).toContain('new FormData(event.currentTarget)');
  expect(ui).toContain('pending.current=false');
  expect(ui).toContain('router.refresh()');
  expect(ui).toContain('name="expectedVersion"');
  expect(ui).toContain('name="action" value="DELETE"');
 });
 it("does not treat unavailable unread names as proof everyone read a notice",()=>{
  const ui=source("src/components/tpo/tpo-notice-read-progress.tsx");
  expect(ui).toContain('isNoticeReadSummary(result)');
  expect(ui).toContain('Array.isArray(record.unread)');
  expect(ui).toContain('(record.read??0)<=(record.delivered??-1)');
  expect(ui).toContain('Unread recipient names are not available yet');
  expect(ui).toContain('Retry read status');
 });
 it("opens send undo without a one-second dead period and acknowledges success",()=>{
  const ui=source("src/components/tpo/tpo-notice-undo-toast.tsx");
  expect(ui).toContain('  refresh();');
  expect(ui).toContain('Announcement send undone.');
  expect(ui).toContain('response.status===409');
  expect(ui).toContain('response.status===403');
  expect(ui).toContain('role="status"');
  expect(ui).toContain('new FormData(event.currentTarget)');
 });
 it("gates the unauthenticated fixture to development-only synthetic data",()=>{
  const fixture=source("src/app/e2e/ux-g158-fixture/page.tsx");
  expect(fixture).toContain('process.env.NODE_ENV!=="development"');
  expect(fixture).toContain('process.env.UX_G158_FIXTURE!=="1"');
  expect(fixture).toContain('notFound()');
  expect(fixture).not.toContain('getCurrentRequestContext');
 });
});
