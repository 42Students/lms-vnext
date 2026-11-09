import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

const source=(name:string)=>readFileSync(join(process.cwd(),"src/components/tracker",name),"utf8");

describe("UX-G161 finding editor recovery contract",()=>{
 it("resets triage selection on finding identity as well as version changes",()=>{
  const triage=source("audit-finding-status-action.tsx");
  expect(triage).toContain("[publicId,current,version]");
  expect(triage).toContain("setStatus(current as BugStatus)");
  expect(triage).toContain("if(response.status===409)setStale(true)");
  expect(triage).toContain("disabled={pending||stale}");
 });
 it("never carries draft reasons, assignees or duplicate targets across finding identities",()=>{
  const actions=source("independent-finding-actions.tsx");
  const effect=actions.match(/useEffect\(\(\)=>\{([\s\S]*?)\},\[externalId,version,status,severity,currentAssignee\]\)/);
  expect(effect).not.toBeNull();
  for(const reset of [
   'setAction("STATUS")','setNextStatus(status)','setNextSeverity(severity)',
   'setAssignee(currentAssignee??"")','setDuplicateOf("")','setSha("")',
   'setNote("")','setConfirmOpen(false)','setError(null)','setStale(false)',
  ])expect(effect?.[1]).toContain(reset);
 });
 it("blocks duplicate writes after conflict or unverified refresh, and offers recovery",()=>{
  const actions=source("independent-finding-actions.tsx");
  expect(actions).toContain('if(lock.current||stale)return;');
  expect(actions).toContain('if(reason.code==="STALE_VERSION"||reason.status===409)setStale(true)');
  expect(actions).toContain('setStale(true); // Block another save until a fresh server version is rendered.');
  expect(actions).toContain('disabled={pending||stale}');
  expect(actions).toContain('confirmDisabled={stale}');
  expect(actions).toContain('>Refresh finding</Button>');
  expect(actions).toContain('onClick={()=>router.refresh()}');
 });
 it("locks known-error triage after a timeout, 5xx or network loss until reload",()=>{
  const known=source("known-errors-workspace.tsx");
  expect(known).toContain("if(needsReload)return;");
  expect(known).toContain("error.status===0||error.status===408||error.status>=500");
  expect(known).toContain("setNeedsReload(true);");
  expect(known).toContain("The update may have been saved. Reload known errors before trying again.");
  expect(known).toContain("Reload known errors");
  expect(known).toContain("onClick={()=>window.location.reload()}");
  expect(known).toContain("disabled={pending || needsReload || Boolean(item.acknowledgedAt)}");
  expect(known).toContain("disabled={pending || needsReload || (commit.trim()");
 });
 it("does not auto-attach sensitive query parameters to issue reports",()=>{
  const launcher=source("tracker-quick-report-launcher.tsx");
  expect(launcher).toContain('window.location.search?" [query parameters omitted for privacy]":""');
  expect(launcher).not.toContain('window.location.pathname+window.location.search');
  expect(launcher).toContain('setContext("Page: "+page');
 });
 it("locks engineering saves and retests on stale-version conflict, not just status changes",()=>{
  const panel=source("tracker-workflow-panel.tsx");
  for(const section of [
   panel.slice(panel.indexOf("function save()"),panel.indexOf("function retest(")),
   panel.slice(panel.indexOf("function retest("),panel.indexOf("if (!canManage)")),
  ]){
   expect(section).toContain('reason instanceof FriendlyFetchError&&reason.status===409');
   expect(section).toContain('setNeedsRefresh(true);');
   expect(section).toContain('router.refresh();');
  }
  expect(panel).toContain('if (pending || needsRefresh || mutationLock.current) return false');
  expect(panel).toContain('expectedVersion:issue.version');
 });
 it("resyncs known-error issue links and clears successful action-only drafts",()=>{
  const known=source("known-errors-workspace.tsx");
  expect(known).toContain('useEffect(() => { setIssuePublicId(item.issuePublicId ?? ""); }, [item.id, item.issuePublicId]);');
  expect(known).toContain('setNote("");');
  expect(known).toContain('setMuteReason("");');
  expect(known).toContain('setCommit("");');
  expect(known).toContain('await apiFetch("/api/tracker/logs/known-errors/" + item.id');
 });
 it("quarantines ambiguous network and provider outcomes until fresh revisions",()=>{
  const triage=source("audit-finding-status-action.tsx");
  expect(triage).toContain("setStale(true);");
  expect(triage).toContain("The outcome could not be confirmed. Refresh the finding before retrying.");
  const actions=source("independent-finding-actions.tsx");
  expect(actions).toContain("if(reason.status>=500)setStale(true);");
  expect(actions).toContain("The result could not be confirmed. Refresh this finding before trying again.");
  const panel=source("tracker-workflow-panel.tsx");
  expect(panel.match(/reason.status>=500/g)??[]).toHaveLength(3);
  expect(panel).toContain("setNeedsRefresh(true);");
  expect(panel).toContain("router.refresh();");
 });
 it("does not allow a second mutation after ambiguous HTTP or network outcomes",()=>{
  const triage=source("audit-finding-status-action.tsx");
  expect(triage).toContain("if(response.status===408||response.status>=500)setStale(true);");
  expect(triage).toContain("The status change may have been saved. Refresh the finding before trying again.");
  const finding=source("independent-finding-actions.tsx");
  expect(finding).toContain("if(reason.status===0||reason.status===408)setStale(true);");
  expect(finding).toContain("if(reason.status>=500)setStale(true);");
  expect(finding).toContain("The update may have been saved. Refresh this finding before trying again.");
  expect(finding).toContain("if(lock.current||stale)return;");
  expect(finding).toContain(">Refresh finding</Button>");
 });
 it("keeps server version checking and mutation confirmation intact",()=>{
  const actions=source("independent-finding-actions.tsx");
  expect(actions).toContain('expectedVersion:version');
  expect(actions).toContain('onConfirm={()=>void submit(true)}');
  expect(actions).toContain('if(!result.ok||result.version<=version)');
  expect(actions).not.toContain('window.confirm(');
 });
});
