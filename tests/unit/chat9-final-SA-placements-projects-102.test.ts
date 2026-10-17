import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 final quick-report launcher",()=>{
 it("SA-placements-projects-102 exposes the existing issue launcher in every authenticated shell without a new unguarded submit route",()=>{
  const shell=read("src/components/shell/app-shell.tsx");
  const launcher=read("src/components/tracker/tracker-quick-report-launcher.tsx");
  const form=read("src/components/tracker/tracker-report-form.tsx");
  expect(shell).toContain('import { TrackerQuickReportLauncher } from "@/components/tracker/tracker-quick-report-launcher"');
  expect(shell).toContain("<TrackerQuickReportLauncher />");
  expect(launcher).toContain('event.altKey&&!event.repeat&&event.key.toLowerCase()==="b"');
  expect(launcher).toContain('event.key==="Escape"');
  expect(launcher).toContain("window.location.pathname+window.location.search");
  expect(launcher).toContain("navigator.userAgent");
  expect(launcher).toContain("window.innerWidth");
  expect(launcher).toContain('aria-modal="true"');
  expect(launcher).toContain("<TrackerReportForm contextPrefill={context}/>");
  expect(form).toContain('useFormDraft("tracker-issue-report",initial)');
  expect(form).toContain('"/api/tracker/issues"');
  expect(form).toContain("apiFetch");
 });
});
