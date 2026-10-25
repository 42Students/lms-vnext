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
  assert.match(shell,/resolvedNavigation\[0\]\?\.href === "\/tpo\/home" \? "tpo"/);
  assert.match(shell,/resolvedNavigation\[0\]\?\.href === "\/hr\/home" \? "recruiter"/);
  assert.match(shell,/resolvedNavigation\[0\]\?\.href === "\/mentor\/projects" \? "mentor"/);
  const routeFrame=source("src/components/shell/prototype-portal-frame.tsx");
  assert.match(shell,/<PrototypePortalFrame\s/);
  assert.match(shell,/mentorEnabled=\{hasMembershipRole\(context,"MENTOR"\)\}/);
  assert.match(shell,/tpoEnabled=\{hasMembershipRole\(context,"TPO"\)\}/);
  assert.match(shell,/recruiterEnabled=\{/);
  const roleSkin=source("src/components/shell/prototype-role-skin-model.ts");
  assert.match(routeFrame,/prototypeRoleSkinForPath\(/);
  assert.match(roleSkin,/input\.mentorEnabled&&/);
  assert.match(roleSkin,/input\.tpoEnabled&&/);
  assert.match(roleSkin,/input\.recruiterEnabled&&/);
  assert.match(routeFrame,/data-prototype-portal=\{portal\?\?undefined\}/);
  assert.match(roleSkin,/pathname\.startsWith\("\/mentor\/"\)/);
  assert.match(roleSkin,/pathname\.startsWith\("\/tpo\/"\)/);
  assert.match(roleSkin,/pathname\.startsWith\("\/hr\/"\)/);
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
  assert.match(route,/listOwnMentorAttentionLater\(context,attentionRows\)/);
  assert.match(route,/initialLater=\{initialLater\}/);
  assert.match(home,/mentorAttentionReceiptKey\(item\)/);
  assert.match(home,/\/api\/mentor\/attention\/later/);
  assert.match(home,/method:"POST"/);
  assert.match(home,/onClick=\{\(\)=>void later\(item\)\}/);
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
  assert.match(topbar,/\/mentor\/search\?q=/);
  assert.match(topbar,/\/mentor\/calendar\?search=/);
});

test("Mentor table milestones come from scoped nondeleted sprint and task records",()=>{
  const service=source("src/modules/projects/mentor-prototype-sprint-summary-service.ts");
  const list=source("src/components/projects/project-list.tsx");
  const page=source("src/app/(authenticated)/mentor/projects/page.tsx");
  assert.match(service,/hasMembershipRole\(context,"MENTOR"\)/);
  assert.match(service,/inArray\(projectSprints\.projectId,ids\)/);
  assert.match(service,/isNull\(projectSprints\.deletedAt\)/);
  assert.match(service,/return summarizeMentorProjectSprints\(rows\)/);
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
  assert.match(src,/group\.tasks\.map\(task=>/);
  assert.match(src,/sprintListGroups/);
  assert.match(src,/setFocusedId\(task\.id\)/);
  assert.match(src,/MentorBoardTaskDetailDialog/);
  assert.match(src,/projectMutation/);
});

test("Mentor detail route integrates substantive Overview, Sprints, Team, Performance, Activity and Delivery sections",()=>{
  const detail=source("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  const summaries=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  for(const name of ["MentorPrototypeProjectOverview","MentorPrototypeSprintPlan",
    "MentorPrototypeTeamOverview","MentorPrototypePerformance",
    "MentorPrototypeActivitySummary","MentorPrototypeDeliveryEvidence"]){
    assert.match(detail,new RegExp("<"+name+"\\s+workspace="));
    assert.match(summaries,new RegExp("export function "+name+"\\("));
  }
  assert.match(summaries,/safeProjectExternalHref\(latest\.sourceUrl\)/);
  assert.match(summaries,/safeProjectExternalHref\(latest\.demoUrl\)/);
  assert.match(summaries,/sprints\.filter\(s=>s\.status==="COMPLETED"\)/);
  const performance=source("src/components/projects/mentor-prototype-performance-table.tsx");
  assert.match(summaries,/<MentorPrototypePerformanceTable/);
  assert.match(performance,/review:review\.length\+sum\(previous,"waitingCount"\)/);
  assert.match(performance,/Last four worked sprints/);
  assert.match(performance,/Current sprint/);
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
  assert.match(board,/prototype-mentor-board-sprint-group/);
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
  assert.match(page,/<MentorUnifiedNotificationFeed/);
  assert.match(page,/unifiedRows\.filter\(row=>row\.source==="ANNOUNCEMENT"\)/);
  assert.match(page,/announcementNextCursor=\{announcementPage\.nextCursor/);
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
  assert.match(route,/readMentorProjectCommandBody\(request,4096\)/);
  assert.match(route,/postMentorProjectUpdate\(/);
  assert.match(composer,/projectMutation\("\/api\/projects\/"/);
  assert.match(detail,/<MentorProjectUpdateComposer/);
  assert.match(overview,/update\.eventType==="projects\.mentor_update\.posted"/);
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
  assert.match(service,/inArray\(projectTasks\.projectId,ids\)/);
  assert.match(service,/eq\(projectMembers\.role,"LEARNER"\)/);
  assert.match(service,/eq\(collegeMemberships\.status,"ACTIVE"\)/);
  assert.match(service,/eq\(users\.platformStatus,"ACTIVE"\)/);
  assert.match(service,/isNull\(projectTasks\.deletedAt\)/);
  assert.match(service,/inArray\(projectTasks\.status,\s*\["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW"\]\)/);
  assert.match(service,/\$\{projectTasks\.status\} = 'BLOCKED'/);
  assert.match(service,/\$\{projectTasks\.status\} = 'IN_REVIEW'/);
  assert.match(route,/getMentorStudentWatch\(context/);
  assert.match(home,/studentWatch\.slice\(0,5\)\.map/);
  assert.match(home,/Students to watch/);
});


test("Mentor global search covers projects tasks active students and resources without guessed tenant IDs",()=>{
  const search=source("src/modules/projects/mentor-unified-search-service.ts");
  const page=source("src/app/(authenticated)/mentor/search/page.tsx");
  const config=source("src/components/shell/topbar/portal-config.ts");
  assert.match(search,/hasMembershipRole\(context,"MENTOR"\)/);
  assert.match(search,/listMyProjectInstances\(context\)/);
  assert.match(search,/byId=new Map\(projects\.map/);
  assert.match(search,/inArray\(projectTasks\.projectId,ids\)/);
  assert.match(search,/inArray\(projectResources\.projectId,ids\)/);
  assert.match(search,/inArray\(projectMembers\.projectId,ids\)/);
  assert.match(search,/eq\(collegeMemberships\.collegeId,membership\.collegeId\)/);
  assert.match(search,/eq\(projectMembers\.role,"LEARNER"\)/);
  assert.match(search,/isNull\(projectTasks\.deletedAt\)/);
  assert.match(search,/\.limit\(SEARCH_PAGE_SIZE\+1\)/);
  assert.match(page,/searchMentorWorkspacePage\(/);
  assert.match(page,/mentor-unified-search/);
  assert.match(config,/\/mentor\/search\?q=/);
});


test("Mentor Performance filters current, last four and selected sprint work, preserving editor",()=>{
  const perf=source("src/components/projects/mentor-prototype-performance-table.tsx");
  const summaries=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  const detail=source("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  assert.match(perf,/setRange\(event\.target\.value\)/);
  assert.match(perf,/value="last4"/);
  assert.match(perf,/value="current"/);
  assert.match(perf,/selectMentorPerformanceSprints\(/);
  assert.match(perf,/task\.sprintId===active\?\.id/);
  assert.match(perf,/task\.assigneeMembershipId===student\.id/);
  assert.match(summaries,/<MentorPrototypePerformanceTable/);
  assert.match(detail,/<MentorTaskAllocation/);
});


test("Mentor Meetings selected pane exposes real persisted facilitation and edit location",()=>{
  const model=source("src/modules/projects/mentor-meeting-facilitation-model.ts");
  const service=source("src/modules/projects/mentor-calendar-service.ts");
  const view=source("src/modules/projects/mentor-calendar-view.ts");
  const calendar=source("src/components/projects/mentor-meetings-calendar.tsx");
  const workspace=source("src/components/projects/project-workspace.tsx");
  assert.match(model,/attendees:z\.array\(meetingAttendeeSchema\)/);
  assert.match(model,/actionItemRows:z\.array\(meetingActionRowSchema\)/);
  assert.match(model,/retroActions:z\.array\(meetingRetroActionSchema\)/);
  assert.match(model,/followUpStatus:z\.enum/);
  assert.match(service,/facilitation:projectMeetings\.facilitation/);
  assert.match(service,/agenda:projectMeetings\.agenda/);
  assert.match(service,/facilitation:row\.facilitation/);
  assert.match(view,/facilitation\?:Partial<MentorMeetingFacilitation>/);
  assert.match(calendar,/meeting\.facilitation\?\.attendees/);
  assert.match(calendar,/meeting\.facilitation\?\.actionItemRows/);
  assert.match(calendar,/meeting\.facilitation\?\.followUpStatus/);
  assert.match(calendar,/\?tab=team#meeting-/);
  assert.match(workspace,/id=\{"meeting-"\+meeting\.id\}/);
  assert.match(workspace,/<ScheduleProjectMeetingControl/);
});


test("Mentor sprint sign-off explicitly gates review tasks and persists note atomically",()=>{
  const page=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  const signoff=source("src/components/projects/mentor-sprint-sign-off.tsx");
  const route=source("src/app/api/projects/[projectId]/sprints/[sprintId]/complete/route.ts");
  const service=source("src/modules/projects/lifecycle-service.ts");
  assert.match(page,/<MentorSprintSignOff/);
  assert.match(page,/status!=="DONE"/);
  assert.match(signoff,/waiting=unfinished\.filter\(task=>task\.status==="IN_REVIEW"\)/);
  assert.match(signoff,/const canSign=waiting\.length===0&&!pending/);
  assert.match(signoff,/destination:"BACKLOG" as const/);
  assert.match(signoff,/destination:"DROP" as const/);
  assert.match(signoff,/Drop it/);
  assert.match(signoff,/dropConfirmed/);
  assert.match(signoff,/expectedUpdatedAt:task.updatedAt/);
  assert.match(route,/expectedUpdatedAt:z.iso.datetime/);
  assert.match(service,/item.updatedAt.toISOString\(\)!==byTask.get\(item.id\)\?\.expectedUpdatedAt/);
  assert.match(service,/carriedFromSprintId:sprint.id/);
  assert.match(service,/deletedAt:now/);
  assert.match(service,/destination==="NEXT"/);
  assert.match(signoff,/Sign off and start next sprint/);
  assert.match(signoff,/Sprint signed off/);
  assert.match(route,/INVALID_SIGNOFF_NOTE/);
  assert.match(route,/parsed\.data\.note/);
  assert.match(service,/signOffNote\?:string/);
  assert.match(service,/eventType:ACTIVITY_EVENT_TYPES\.PROJECTS_SPRINT_UPDATED/);
  assert.match(service,/signOffNote:note/);
});


test("Mentor calendar cross-team Schedule a meeting persists or drafts through guarded API",()=>{
  const page=source("src/app/(authenticated)/mentor/calendar/page.tsx");
  const form=source("src/components/projects/mentor-calendar-quick-schedule.tsx");
  const route=source("src/app/api/projects/[projectId]/meetings/route.ts");
  assert.match(page,/listMyMentorCalendarMeetings\(context\)/);
  assert.match(page,/listMyProjectInstances\(context\)/);
  assert.match(page,/mentorCalendarCanMutateMeeting/);
  assert.match(page,/projectStatus:row\.project\.status/);
  assert.match(page,/<MentorCalendarQuickSchedule projects=\{choices\}[\s\S]*?googleConnected=\{googleConnection\.connected\}/);
  assert.match(form,/expectedProjectUpdatedAt:project\.updatedAt/);
  assert.match(form,/status:link\?"SCHEDULED":"DRAFT"/);
  assert.match(form,/meetingUrl:link\|\|null/);
  assert.match(form,/\/meetings","POST"/);
  assert.match(form,/fromIstLocalInput\(start\)/);
  assert.match(form,/A saved draft can also generate its Google Meet link/);
  assert.match(form,/if\(!link&&useGoogle&&googleConnected\)/);
  assert.match(form,/if\(!sync\.ok\)throw Error/);
  assert.match(form,/The meeting draft was saved, but Google synchronization was not verified/);
  const sync=source("src/modules/projects/mentor-google-meeting-sync-service.ts");
  assert.match(sync,/if\(draft&&!event\.meetUrl\)/);
  assert.match(sync,/status:"SCHEDULED",meetingUrl:event\.meetUrl!/);
  assert.match(route,/isSameOriginRequest/);
  assert.match(route,/scheduleProjectMeeting\(/);
});


test("Mentor meeting request offers real Yes, Another time and No actions with guarded endpoints",()=>{
  const panel=source("src/components/projects/mentor-meeting-request-actions.tsx");
  const calendar=source("src/components/projects/mentor-meetings-calendar.tsx");
  assert.match(calendar,/<MentorMeetingRequestActions meeting=\{meeting\}/);
  assert.match(panel,/meeting\.status!=="REQUESTED"/);
  assert.match(panel,/expectedUpdatedAt:meeting\.updatedAt/);
  assert.match(panel,/status:"SCHEDULED"/);
  assert.match(panel,/base,"PATCH"/);
  assert.match(panel,/base\+"\/mentor-decision","POST"/);
  assert.match(panel,/action:"CANCEL",confirmed:true/);
  assert.match(panel,/Another time/);
  assert.match(panel,/No, answer in a note/);
  assert.match(panel,/No link is generated automatically/);
});

test("Mentor Activity since-seen message states local-device limitations",()=>{
  const marker=source("src/components/projects/mentor-activity-since-last-visit.tsx");
  const route=source("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  assert.match(marker,/\/activity\/seen/);
  assert.match(marker,/method:"POST"/);
  assert.match(marker,/cross-device tracking/);
  assert.match(marker,/newCount/);
  assert.match(route,/<MentorActivitySinceLastVisit\s+projectId=/);
});

test("Mentor Resources show real pinned group without breaking resource actions",()=>{
  const resources=source("src/components/projects/project-resource-list.tsx");
  assert.match(resources,/orderedResources\.map\(\(resource,index\)=>/);
  assert.match(resources,/resource\.pinned\?<StatusBadge/);
  assert.match(resources,/mentorResourceGroupOrder\(listOrder,sprints\)/);
  assert.match(resources,/<ProjectResourceActions/);
  assert.match(resources,/fragment/i);
});

test("Mentor final submission Zoom uses sandboxed supported evidence links only",()=>{
  const preview=source("src/components/projects/mentor-evidence-preview.tsx");
  const summary=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  assert.match(preview,/previewable=/);
  assert.match(preview,/jpe\?g\|webp\|gif/);
  assert.match(preview,/sandbox=""/);
  assert.match(preview,/referrerPolicy="no-referrer"/);
  assert.match(preview,/Open full size/);
  assert.match(summary,/<MentorEvidenceGallery/);
  assert.match(summary,/safeProjectExternalHref\(url\)/);
});


test("Mentor Projects last activity uses recorded scoped events rather than project updatedAt",()=>{
  const service=source("src/modules/projects/mentor-project-last-activity-service.ts");
  const page=source("src/app/(authenticated)/mentor/projects/page.tsx");
  const list=source("src/components/projects/project-list.tsx");
  assert.match(service,/hasMembershipRole\(context,"MENTOR"\)/);
  assert.match(service,/listMyProjectInstances\(context\)/);
  assert.match(service,/eq\(activityEvents\.collegeId,member\.collegeId\)/);
  assert.match(service,/inArray\(groupProjectId,ids\)/);
  assert.match(service,/max\(\$\{activityEvents\.occurredAt\}\)/);
  assert.match(page,/getMentorProjectLastActivity\(context\)/);
  assert.match(page,/lastActivityAt:lastActivity\.get/);
  assert.match(list,/const activityAt=item\.lastActivityAt/);
  assert.match(list,/No recorded activity/);
});

test("Mentor calendar global ICS includes only scheduled persisted event windows",()=>{
  const calendar=source("src/components/projects/mentor-meetings-calendar.tsx");
  assert.match(calendar,/function downloadAllMentorMeetings/);
  assert.match(calendar,/\["SCHEDULED","RESCHEDULED"\]\.includes\(meeting\.status\)/);
  assert.match(source("src/modules/projects/mentor-calendar-ics-model.ts"),/END:VCALENDAR/);
  assert.match(source("src/modules/projects/mentor-calendar-ics-model.ts"),/UID:/);
  assert.match(calendar,/onClick=\{\(\)=>downloadAllMentorMeetings\(meetings\)\}/);
  assert.match(calendar,/Add to my calendar \(\.ics\)/);
});

test("Mentor Team roster uses actual active sprint, last four sprint tasks and task-change timestamps",()=>{
  const summaries=source("src/components/projects/mentor-prototype-project-summaries.tsx");
  assert.match(summaries,/export function MentorPrototypeTeamOverview/);
  assert.match(summaries,/sprint\.status==="ACTIVE"/);
  assert.match(summaries,/recentMentorWorkedSprintIds\(workspace\.sprints,workspace\.releases\)/);
  assert.match(summaries,/task\.assigneeMembershipId===member\.membershipId/);
  assert.match(summaries,/mentorTeamRecentActorActivity/);
  assert.match(summaries,/Project action:/);
  assert.match(summaries,/Last sign-in comes from a saved authentication timestamp/);
  assert.match(summaries,/Neither establishes current online presence or attendance/);
});

test("Mentor Activity can filter by recorded actor, not a guessed team identity",()=>{
  const activity=source("src/components/projects/project-activity-filtered-list.tsx");
  assert.match(activity,/const \[actor,setActor\]=useState/);
  assert.match(activity,/event\.actorUserId===actor/);
  assert.match(activity,/actorUserId:nextActor/);
  assert.match(activity,/By anyone/);
  assert.match(activity,/setActor\(""\)/);
});
