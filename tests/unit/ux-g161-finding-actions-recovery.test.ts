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
 it("does not auto-attach sensitive query parameters to issue reports",()=>{
  const launcher=source("tracker-quick-report-launcher.tsx");
  expect(launcher).toContain('window.location.search?" [query parameters omitted for privacy]":"");
  expect(launcher).not.toContain('window.location.pathname+window.location.search');
  expect(launcher).toContain('setContext("Page: "+page');
 });
 it("keeps server version checking and mutation confirmation intact",()=>{
  const actions=source("independent-finding-actions.tsx");
  expect(actions).toContain('expectedVersion:version');
  expect(actions).toContain('onConfirm={()=>void submit(true)}');
  expect(actions).toContain('if(!result.ok||result.version<=version)');
  expect(actions).not.toContain('window.confirm(');
 });
});
