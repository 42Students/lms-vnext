import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {mentorActivityCategory,mentorActivityLabel} from "@/modules/projects/mentor-activity-display-model";
import {deriveMentorProjectAttention} from "@/modules/projects/mentor-attention";
import {createProjectResourceInputSchema,updateProjectResourceInputSchema} from "@/modules/projects/validation";

const read=(path:string)=>readFileSync(path,"utf8");

describe("chat-16 reassigned mentor legacy parity",()=>{
  it("MEN-projects-meetings-53 models type, status, pin, access notes and scoped sprint/task associations",()=>{
    const uid="123e4567-e89b-42d3-a456-426614174001";
    const resource=createProjectResourceInputSchema.parse({
      title:"Resource A",description:"Useful context",resourceType:"DOCUMENT",
      status:"DRAFT",pinned:true,accessNotes:"Available during review",sprintId:uid,taskId:null,
    });
    expect(resource.status).toBe("DRAFT");
    expect(resource.resourceType).toBe("DOCUMENT");
    expect(resource.pinned).toBe(true);
    expect(createProjectResourceInputSchema.safeParse({
      title:"Resource B",description:"Context",resourceType:"SECRET",
    }).success).toBe(false);
    expect(updateProjectResourceInputSchema.safeParse({pinned:true}).success).toBe(true);
    const schema=read("src/db/schema/projects.ts");
    expect(schema).toContain('resourceType: varchar("resource_type"');
    expect(schema).toContain('sprintId: uuid("sprint_id")');
    expect(schema).toContain('taskId: uuid("task_id")');
    const service=read("src/modules/projects/resource-service.ts");
    expect(service).toContain("eq(projectSprints.projectId,scope.project.id)");
    expect(service).toContain("eq(projectTasks.projectId,scope.project.id)");
    expect(read("docs/proposed-migrations/registered-0133/mentor-resources-legacy-metadata.sql"))
      .toContain("project_resources_task_project_fk");
  });
  it("MEN-projects-meetings-55 exposes type, status, pin, visibility, sprint/task and reset filters",()=>{
    const list=read("src/components/projects/project-resource-list.tsx");
    for(const label of ["All statuses","Pinned only","All sprints","All tasks",
      "Search resources","Clear filters","All types","Visible to","Drafts","Archived"]){
      expect(list).toContain(label);
    }
    expect(list).toContain("row.sprintId===sprint");
    expect(list).toContain("row.taskId===task");
    expect(list).toContain("status===\"ALL\"||row.status===status");
  });
  it("MEN-projects-meetings-57 shows resource status, pin, file/link type, notes and safe link action",()=>{
    const list=read("src/components/projects/project-resource-list.tsx");
    expect(list).toContain("Last updated:");
    expect(list).toContain("resource.resourceType");
    expect(list).toContain("resource.accessNotes");
    expect(list).toContain("resource.pinned");
    expect(list).toContain("resource.status");
    expect(list).toContain("ProjectResourceOpenLink");
    const popup=read("src/components/projects/project-resource-open-link.tsx");
    expect(popup).toContain("Copy the link to open it manually.");
  });
  it("MEN-projects-meetings-56 reorders only owned active resources in two collision-safe phases",()=>{
    const service=read("src/modules/projects/resource-service.ts");
    const route=read("src/app/api/projects/[projectId]/resources/reorder/route.ts");
    const list=read("src/components/projects/project-resource-list.tsx");
    expect(service).toContain("requireProjectLifecycleAccess(context,projectIdInput)");
    expect(service).toContain("active.some(row=>!orderIds.includes(row.id))");
    expect(service).toContain("maxSequence+1+i");
    expect(service).toContain("sequence:active[i]!.sequence");
    expect(service).toContain("new Set(ids).size===ids.length");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(list).toContain("onDragStart");
    expect(list).toContain("onDrop");
    expect(list).toContain("Move up");
    expect(list).toContain("Move down");
    expect(list).toContain("Clear filters");
  });
  it("MEN-projects-meetings-60 pages beyond 100 without dropping or duplicating activity",()=>{
    const code=read("src/components/projects/project-activity-filtered-list.tsx");
    expect(code).toContain("Load more activity");
    expect(code).toContain("page.nextCursor");
    expect(code).toContain("new Set(previous.map(event=>event.id))");
    expect(code).toContain("beforeTime:next.time,beforeId:next.id");
    expect(code).toContain("setHasMore(page.hasMore)");
  });
  it("MEN-projects-meetings-61 shows human-readable labels, category, and legacy empty states",()=>{
    const code=read("src/components/projects/project-activity-filtered-list.tsx");
    expect(mentorActivityLabel("PROJECT_TASK_UPDATED")).toBe("Task Updated");
    expect(mentorActivityCategory("PROJECT_RESOURCE_ADDED")).toBe("Resource");
    expect(code).toContain('role="feed"');
    expect(code).toContain("No project activity yet. Task moves, sprint updates and resource changes will appear here.");
    expect(code).toContain("No activity matches this source and date range.");
    expect(code).toContain("Clear filters");
  });
  it("MEN-projects-meetings-67 retains legacy Meetings text and action wording",()=>{
    const page=read("src/app/(authenticated)/mentor/calendar/page.tsx");
    const calendar=read("src/components/projects/mentor-meetings-calendar.tsx");
    expect(page).toContain("Every scheduled meeting across your assigned projects, in one place.");
    expect(calendar).toContain(">Join link</a>");
    expect(calendar).not.toContain("Awaiting your response in the project workspace.");
    expect(calendar).toContain("No upcoming meetings.");
    expect(calendar).toContain("No past meetings yet.");
  });
  it("MEN-projects-meetings-70 renders legacy notification heading and persisted attention labels",()=>{
    const page=read("src/app/(authenticated)/mentor/notifications/page.tsx");
    expect(page).toContain("Announcements, submissions waiting for review, stalled projects, and meetings coming up soon.");
    expect(page).toContain("Nothing needs your attention right now.");
    expect(page).toContain("Needs review");
    expect(page).toContain("Meeting requested");
    const alerts=deriveMentorProjectAttention([{
      projectId:"project-test",projectTitle:"Project Pine",projectStatus:"ACTIVE",
      projectUpdatedAt:new Date("2099-06-30T00:00:00Z"),lastActivityAt:null,
      submission:{id:"delivery",status:"SUBMITTED",submittedAt:new Date("2099-07-01T00:00:00Z")},
      meetings:[],
    }],new Date("2099-07-01T02:00:00Z"));
    expect(alerts.some(a=>a.title==="Project Pine — submission waiting for your review")).toBe(true);
  });
  it("MEN-projects-meetings-69 keeps meeting load failure inline with a Retry action",()=>{
    const page=read("src/app/(authenticated)/mentor/calendar/page.tsx");
    const fallback=read("src/components/projects/mentor-calendar-load-failure.tsx");
    expect(page).toContain("listMyMentorCalendarMeetings(context).catch(()=>null)");
    expect(page).toContain("<MentorCalendarLoadFailure/>");
    expect(fallback).toContain("We couldn&apos;t load your meetings.");
    expect(fallback).toContain("router.refresh()");
    expect(fallback).toContain("Retry");
  });
  it("MEN-projects-meetings-65 confirms each final submission decision and preserves stale-review guidance",()=>{
    const control=read("src/components/projects/project-final-delivery-controls.tsx");
    const reopen=read("src/components/projects/project-delivery-reopen-control.tsx");
    expect(control).toContain('title="Review submission"');
    expect(control).toContain("Accept this submission?");
    expect(control).toContain("The learner will be notified their submission was accepted.");
    expect(control).toContain("Request changes?");
    expect(control).toContain("This submission may have changed since you opened this review.");
    expect(control).toContain("expectedUpdatedAt,confirmed:true");
    expect(control).toContain("Submission accepted.");
    expect(reopen).toContain("Reopen for revision");
    expect(reopen).toContain("Reopen this submission for revision?");
  });
  it("MEN-projects-meetings-74 preserves redirect-only legacy Mentor URLs",()=>{
    const redirects=[
      ["profile/page.tsx","/mentor/projects"],
      ["allQuizzes/page.tsx","/mentor/projects"],
      ["fileExplorer/page.tsx","/mentor/projects"],
      ["contacts/[[...contactsTab]]/page.tsx","/mentor/projects"],
      ["courses/page.tsx","/mentor"],
      ["courses/[courseId]/[[...courseTab]]/page.tsx","/mentor/projects"],
    ] as const;
    for(const [file,target] of redirects){
      expect(read("src/app/(authenticated)/mentor/"+file)).toContain('redirect("'+target+'")');
    }
  });
});
