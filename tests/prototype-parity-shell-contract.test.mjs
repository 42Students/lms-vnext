import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const root=process.cwd();
const source=(path)=>readFileSync(join(root,path),"utf8");

/** Source-only safeguards. Not screenshot parity or a claim of browser verification. */
test("prototype parity remains limited to the three opted-in single-workspace portals",()=>{
  const shell=source("src/components/shell/app-shell.tsx");
  const css=source("src/styles/prototype-portals.css");
  const global=source("src/app/globals.css");
  assert.match(shell,/navigation\[0\]\?\.href === "\/tpo\/home" \? "tpo"/);
  assert.match(shell,/navigation\[0\]\?\.href === "\/hr\/home" \? "recruiter"/);
  assert.match(shell,/navigation\[0\]\?\.href === "\/mentor\/projects" \? "mentor"/);
  assert.match(shell,/data-prototype-portal=\{prototypePortal \?\? undefined\}/);
  assert.match(global,/@import "\.\.\/styles\/prototype-portals\.css"/);
  assert.match(css,/\.lms-shell-frame\[data-prototype-portal\]/);
  assert.match(css,/\.lms-shell-frame\[data-prototype-portal="mentor"\]/);
  assert.doesNotMatch(css,/\.lms-shell-frame\s*\{/);
});

test("prototype shell renders the real recruiter drive action",()=>{
  const shell=source("src/components/shell/app-shell.tsx");
  assert.match(shell,/<Link href="\/hr\/drives\/new" className="lms-prototype-recruiter-action">/);
  assert.match(shell,/\+ Request a drive/);
});

test("mentor uses a dedicated six-column list, learner retains its own cards",()=>{
  const code=source("src/components/projects/project-list.tsx");
  const css=source("src/styles/prototype-portals.css");
  assert.match(code,/if \(basePath === "\/mentor\/projects"\) \{/);
  assert.match(code,/if \(basePath === "\/learn\/projects"\) \{/);
  assert.match(code,/prototype-mentor-team-table/);
  assert.match(code,/Team and project/);
  assert.match(code,/aria-label=\{"Project progress for " \+ item\.title\}/);
  assert.match(css,/grid-template-columns: minmax\(0,2\.1fr\).*minmax\(0,1\.1fr\)/);
});

test("all 56 prototype screens remain tracked but not deceptively verified",()=>{
  const doc=source("docs/prototypes/tpo-recruiter-mentor-parity.md");
  const rows=doc.match(/^\| \d\d \|/gm)??[];
  assert.equal(rows.length,56);
  assert.match(doc,/None of the 56 screens are closed or browser-verified/);
});


test("Mentor detail uses seven prototype tabs without deleting the review deep link",()=>{
  const tabs=source("src/components/projects/mentor-project-tabs.tsx");
  const page=source("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  const titles=["Overview","Board","Sprints & releases","Team & meetings",
    "Performance","Resources","Activity"];
  for(const label of titles)assert.ok(tabs.includes('label: "'+label+'"'),label);
  assert.equal((tabs.match(/key: "/g)??[]).length,7);
  assert.doesNotMatch(tabs,/key: "delivery"/);
  assert.match(page,/selectedTab\s*===\s*"delivery"/);
  assert.match(page,/prototype-mentor-sprint-track/);
  assert.match(page,/timeline\.map\(sprint/);
});

test("Mentor home focus uses real scoped attention and event-keyed Later action",()=>{
  const home=source("src/components/projects/mentor-prototype-home.tsx");
  const route=source("src/app/(authenticated)/mentor/projects/page.tsx");
  assert.match(route,/attention=\{attentionRows\}/);
  assert.match(route,/scope=\{context\.user\.id\}/);
  assert.match(home,/item\.key\+"@"\+item\.occurredAt/);
  assert.match(home,/localStorage\.setItem\(storageKey\(scope\)/);
  assert.match(home,/onClick=\{\(\)=>later\(item\)\}/);
  assert.match(home,/href=\{item\.href\}/);
});

test("Mentor Meetings and Notifications expose prototype split panels",()=>{
  const meetings=source("src/components/projects/mentor-meetings-calendar.tsx");
  const inbox=source("src/app/(authenticated)/mentor/notifications/page.tsx");
  assert.match(meetings,/prototype-mentor-week-strip/);
  assert.match(meetings,/prototype-mentor-meeting-columns/);
  assert.match(meetings,/onClick=\{\(\)=>setSelectedId\(item\.id\)\}/);
  assert.match(meetings,/<MeetingRow key=\{selected\.id\}/);
  assert.match(inbox,/prototype-mentor-notifications-columns/);
  assert.match(inbox,/What you’re told about/);
});

test("Mentor search is only routed to authorized implemented filters",()=>{
  const topbar=source("src/components/shell/topbar/portal-config.ts");
  assert.match(topbar,/case "mentor": return \[/);
  assert.match(topbar,/\/mentor\/projects\?search=/);
  assert.match(topbar,/\/mentor\/calendar\?search=/);
});

test("Mentor table milestones come from scoped nondeleted sprint and task records",()=>{
  const service=source("src/modules/projects/mentor-prototype-sprint-summary-service.ts");
  const list=source("src/components/projects/project-list.tsx");
  const page=source("src/app/(authenticated)/mentor/projects/page.tsx");
  assert.match(service,/hasMembershipRole\(context,"MENTOR"\)/);
  assert.match(service,/inArray\(projectSprints\.projectId,ids\)/);
  assert.match(service,/isNull\(projectSprints\.deletedAt\)/);
  assert.match(service,/segments\.push\(\{sequence:row\.sequence,status:row\.status\}\)/);
  assert.match(page,/getMentorPrototypeSprintSummaries\(context/);
  assert.match(page,/getMentorProjectWorkCounts\(context/);
  assert.match(list,/sprintSeries\.slice\(0,32\)/);
  assert.match(list,/taskSummary/);
});


test("Mentor Board provides real keyboard-accessible Board/List controls and task details",()=>{
  const src=source("src/components/projects/mentor-lane-board.tsx");
  assert.match(src,/view,setView/);
  assert.match(src,/aria-label="Task presentation"/);
  assert.match(src,/aria-pressed=\{view==="board"\}/);
  assert.match(src,/aria-pressed=\{view==="list"\}/);
  assert.match(src,/visible\.map\(task=>/);
  assert.match(src,/setSelected\(task\.id\)/);
  assert.match(src,/MentorBoardTaskDetailDialog/);
  assert.match(src,/projectMutation/);
});

test("Mentor detail route integrates substantive Overview, Sprints, Team, Performance, Activity and Delivery sections",()=>{
  const detail=source("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  const summaries=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  for(const name of ["MentorPrototypeProjectOverview","MentorPrototypeSprintPlan",
    "MentorPrototypeTeamOverview","MentorPrototypePerformance",
    "MentorPrototypeActivitySummary","MentorPrototypeDeliveryEvidence"]){
    assert.match(detail,new RegExp("<"+name+" workspace="));
    assert.match(summaries,new RegExp("export function "+name+"\\("));
  }
  assert.match(summaries,/safeProjectExternalHref\(latest\.sourceUrl\)/);
  assert.match(summaries,/safeProjectExternalHref\(latest\.demoUrl\)/);
  assert.match(summaries,/sprints\.filter\(s=>s\.status==="COMPLETED"\)/);
  assert.match(summaries,/countTasks\(owned,"IN_REVIEW"\)/);
});

test("Mentor resource earlier-sprint grouping preserves manager filters",()=>{
  const resources=source("src/components/projects/project-resource-list.tsx");
  const workspace=source("src/components/projects/project-workspace.tsx");
  assert.match(resources,/mode==="MENTOR"&&earlierCount>0/);
  assert.match(resources,/earlierSprintIds/);
  assert.match(resources,/showEarlier,setShowEarlier/);
  assert.match(workspace,/label:item\.title,status:item\.status/);
  assert.match(resources,/status==="ACTIVE"/);
});
