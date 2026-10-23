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
  const routeFrame=source("src/components/shell/prototype-portal-frame.tsx");
  assert.match(shell,/<PrototypePortalFrame\s/);
  assert.match(shell,/mentorEnabled=\{hasMembershipRole\(context,"MENTOR"\)\}/);
  assert.match(shell,/tpoEnabled=\{hasMembershipRole\(context,"TPO"\)\}/);
  assert.match(shell,/recruiterEnabled=\{/);
  assert.match(routeFrame,/mentorEnabled&&/);
  assert.match(routeFrame,/tpoEnabled&&/);
  assert.match(routeFrame,/recruiterEnabled&&/);
  assert.match(routeFrame,/data-prototype-portal=\{portal\?\?undefined\}/);
  assert.match(routeFrame,/pathname\.startsWith\("\/mentor\/"\)/);
  assert.match(routeFrame,/pathname\.startsWith\("\/tpo\/"\)/);
  assert.match(routeFrame,/pathname\.startsWith\("\/hr\/"\)/);
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


test("Mentor Board prototype selected-task pane remains separate from the full dialog",()=>{
  const board=source("src/components/projects/mentor-lane-board.tsx");
  const styles=source("src/styles/prototype-portals.css");
  assert.match(board,/prototype-mentor-board-with-pane/);
  assert.match(board,/prototype-mentor-board-detail/);
  assert.match(board,/focusedId,setFocusedId/);
  assert.match(board,/onClick=\{\(\)=>setFocusedId\(task\.id\)\}/);
  assert.match(board,/onClick=\{\(\)=>setSelected\(focused\.id\)\}/);
  assert.match(board,/Find a task by title, type, description or assignee/);
  assert.match(board,/ProjectTaskComments key=\{focused\.id\}/);
  assert.match(styles,/grid-template-columns:minmax\(0,1fr\) minmax\(270px,312px\)/);
});

test("Mentor review uses actual decision field and editable reason shortcuts",()=>{
  const summaries=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  const review=source("src/components/projects/project-final-delivery-controls.tsx");
  assert.match(summaries,/review\.decision\.replaceAll/);
  assert.doesNotMatch(summaries,/review\.status\.replaceAll/);
  assert.match(review,/prototype-mentor-review-reasons/);
  assert.match(review,/lines\.filter\(line=>line!==reason\)/);
  assert.match(review,/expectedUpdatedAt/);
});

test("collapsed earlier sprint resources cannot be reordered invisibly",()=>{
  const resources=source("src/components/projects/project-resource-list.tsx");
  assert.match(resources,/mode==="MENTOR"&&!showEarlier&&sprints\.some/);
  assert.match(resources,/setShowEarlier\(value=>!value\)/);
});

test("CI enforces prototype contracts alongside global source contracts",()=>{
  const workflow=source(".github/workflows/ci.yml");
  assert.match(workflow,/Prototype portal source contracts/);
  assert.match(workflow,/node --test tests\/prototype-parity-shell-contract\.test\.mjs/);
});


test("Mentor Notifications pills filter real source categories and unread pagination",()=>{
  const page=source("src/app/(authenticated)/mentor/notifications/page.tsx");
  const css=source("src/styles/prototype-portals.css");
  assert.match(page,/prototype-mentor-notification-pills/);
  for(const key of ['"all"','"unread"','"subs"','"meet"','"tasks"','"ann"'])
    assert.ok(page.includes(key),"Missing notification pill "+key);
  assert.match(page,/selectedPill==="unread" \? "unread"/);
  assert.match(page,/mentorInboxPageHref\(inbox\.query\.view,inbox\.page\.nextCursor\)/);
  assert.match(page,/selectedPill==="meet" \? alert\.kind==="REQUESTED"\|\|alert\.kind==="MEETING_SOON"/);
  assert.match(page,/<NotificationList items=\{shownInbox\}/);
  assert.match(page,/<AnnouncementFeed enabled=\{announcementsEnabled\}/);
  assert.match(css,/prototype-mentor-notification-pills>a\[aria-current="page"\]/);
});


test("Mentor Board reviews latest submitted task with server CAS and guarded A/S shortcuts",()=>{
  const board=source("src/components/projects/mentor-lane-board.tsx");
  const actions=source("src/components/projects/project-lifecycle-actions.tsx");
  assert.match(board,/focused\.status==="IN_REVIEW"/);
  assert.match(board,/row\.status==="SUBMITTED"/);
  assert.match(board,/submittedReview\.updatedAt/);
  assert.match(board,/initialDecision="APPROVED" triggerLabel="Approve A" shortcut="a"/);
  assert.match(board,/initialDecision="CHANGES_REQUESTED" triggerLabel="Send back S" shortcut="s"/);
  assert.match(board,/event\.key\.toLowerCase\(\)/);
  assert.match(actions,/initialDecision\?:"APPROVED"\|"CHANGES_REQUESTED"/);
  assert.match(actions,/document\.querySelector\('\[role="dialog"\]'\)/);
  assert.match(actions,/expectedUpdatedAt,confirmed:true/);
});

test("Mentor posted Activity updates are persisted in scoped project events and Overview",()=>{
  const taxonomy=source("src/modules/activity/taxonomy.ts");
  const service=source("src/modules/projects/mentor-project-update-service.ts");
  const route=source("src/app/api/projects/[projectId]/mentor-updates/route.ts");
  const composer=source("src/components/projects/mentor-project-update-composer.tsx");
  const detail=source("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  const overview=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  assert.match(taxonomy,/PROJECTS_MENTOR_UPDATE_POSTED/);
  assert.match(service,/requireProjectLifecycleMutationAccess/);
  assert.match(service,/access\.access!=="MENTOR"\|\|access\.project\.status!=="ACTIVE"/);
  assert.match(service,/eventType:ACTIVITY_EVENT_TYPES\.PROJECTS_MENTOR_UPDATE_POSTED/);
  assert.match(route,/export async function POST/);
  assert.match(route,/raw\.length>4096/);
  assert.match(route,/postMentorProjectUpdate\(/);
  assert.match(composer,/projectMutation\("\/api\/projects\/"/);
  assert.match(detail,/<MentorProjectUpdateComposer/);
  assert.match(overview,/event\.eventType==="projects\.mentor_update\.posted"/);
});

test("Mentor sprint release controls and learner-facing brief derive from existing schema",()=>{
  const detail=source("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  const summaries=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  assert.match(detail,/<MentorPrototypeProjectBrief workspace=\{workspace\}/);
  assert.match(detail,/<MentorPrototypeSprintPlan workspace=\{workspace\} readOnly=/);
  assert.match(summaries,/workspace\.project\.authoredBrief/);
  assert.match(summaries,/completionConditions/);
  assert.match(summaries,/<SprintLifecycleActions/);
  assert.match(summaries,/<ReleaseLifecycleActions/);
  assert.match(summaries,/workspace\.finalDelivery\.history/);
  assert.match(summaries,/safeProjectExternalHref\(url\)/);
});

test("Mentor Meetings display existing meeting notes and request workflows",()=>{
  const calendar=source("src/components/projects/mentor-meetings-calendar.tsx");
  assert.match(calendar,/meeting\.status==="COMPLETED"/);
  assert.match(calendar,/encodeURIComponent\(meeting\.id\)\+"\/notes"/);
  assert.match(calendar,/meeting\.status==="REQUESTED"/);
  assert.match(calendar,/\/team-meetings/);
  assert.match(calendar,/downloadMeetingCalendar\(meeting\)/);
});


test("Mentor student watch uses active scoped learner roles and real blocked/review tasks",()=>{
  const service=source("src/modules/projects/mentor-student-watch-service.ts");
  const route=source("src/app/(authenticated)/mentor/projects/page.tsx");
  const home=source("src/components/projects/mentor-prototype-home.tsx");
  assert.match(service,/hasMembershipRole\(context,"MENTOR"\)/);
  assert.match(service,/inArray\(projectTasks\.projectId,\[\.\.\.byId\.keys\(\)\]\)/);
  assert.match(service,/eq\(projectMembers\.role,"LEARNER"\)/);
  assert.match(service,/eq\(collegeMemberships\.status,"ACTIVE"\)/);
  assert.match(service,/eq\(users\.platformStatus,"ACTIVE"\)/);
  assert.match(service,/isNull\(projectTasks\.deletedAt\)/);
  assert.match(service,/projectTasks\.status,\["BLOCKED","IN_REVIEW"\]/);
  assert.match(route,/getMentorStudentWatch\(context/);
  assert.match(home,/studentWatch\.slice\(0,5\)\.map/);
  assert.match(home,/Students to watch/);
});
