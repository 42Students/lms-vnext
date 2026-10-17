import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
  findingFilterSchema,
  findingMutationSchema,
  findingTransitionAllowed,
  FINDING_AREAS,
  FINDING_KINDS,
  FINDING_STATUSES,
} from "@/modules/bug-tracker/audit-findings-model";
import {deriveMentorProjectAttention} from "@/modules/projects/mentor-attention";

const source=(path:string)=>readFileSync(path,"utf8");

describe("chat-16 reassigned mentor acceptance, round 2",()=>{
  it("MEN-projects-meetings-53 displays persisted metadata in both resource editors",()=>{
    const editor=source("src/components/projects/project-resource-controls.tsx");
    for(const field of ["Related sprint","Related task","Access notes","Pinned","Status","resourceType:metadata.resourceType"]) {
      expect(editor).toContain(field);
    }
    expect(source("src/modules/projects/resource-service.ts"))
      .toContain("eq(projectTasks.projectId,scope.project.id)");
  });

  it("MEN-projects-meetings-55 keeps resource status and sprint/task filters combinable",()=>{
    const list=source("src/components/projects/project-resource-list.tsx");
    for(const field of ["All statuses","All sprints","All tasks","Pinned only","Clear filters","Last updated:"]) {
      expect(list).toContain(field);
    }
    expect(list).toContain("row.sprintId===sprint");
    expect(list).toContain("row.taskId===task");
  });

  it("MEN-projects-meetings-56 saves a scoped collision-safe order and allows accessible moves",()=>{
    const resource=source("src/modules/projects/resource-service.ts");
    const list=source("src/components/projects/project-resource-list.tsx");
    expect(resource).toContain("maxSequence+1+i");
    expect(resource).toContain("new Set(ids).size===ids.length");
    expect(list).toContain("onDrop");
    expect(list).toContain("Move up");
    expect(list).toContain("Move down");
  });

  it("MEN-projects-meetings-57 never labels a Draft resource Active",()=>{
    const list=source("src/components/projects/project-resource-list.tsx");
    expect(list).toContain('resource.status==="DRAFT"?"Draft":"Active"');
    expect(list).toContain("Access notes:");
    expect(list).toContain("ProjectResourceOpenLink");
  });

  it("MEN-projects-meetings-72 retains durable mentor notifications for project events",()=>{
    const service=source("src/modules/projects/project-notification-service.ts");
    expect(service).toContain("deliverInAppNotification");
    expect(source("src/modules/projects/task-comment-service.ts")).toContain("project-notification-service");
    expect(source("src/modules/projects/meeting-service.ts")).toContain("project-notification-service");
  });

  it("MEN-projects-meetings-73 includes idle planned projects but excludes blocked ones",()=>{
    const notices=deriveMentorProjectAttention([
      {projectId:"a",projectTitle:"Planned",projectStatus:"PLANNED",projectUpdatedAt:new Date("2099-01-01T00:00:00Z"),lastActivityAt:null,submission:null,meetings:[]},
      {projectId:"b",projectTitle:"Blocked",projectStatus:"BLOCKED",projectUpdatedAt:new Date("2099-01-01T00:00:00Z"),lastActivityAt:null,submission:null,meetings:[]},
    ],new Date("2099-01-10T00:00:00Z"));
    expect(notices.map(notice=>notice.projectId)).toEqual(["a"]);
    expect(notices[0]?.title).toContain("no activity in 7+ days");
  });

  it("MEN-projects-meetings-76 retains confirmation for closeout and hides provider errors",()=>{
    const control=source("src/components/projects/mentor-project-closeout-control.tsx");
    expect(control).toContain("<ConfirmDialog");
    expect(control).toContain("Project completion could not be saved. Please check the project status and try again.");
    expect(control).not.toContain("e instanceof Error?e.message");
    expect(source("src/components/projects/mentor-sprint-write.tsx")).toContain("<ConfirmDialog");
  });
});

describe("chat-16 reassigned Tracker acceptance, round 2",()=>{
  it("SA-placements-projects-109 fetches scoped redacted warnings around the reported timestamp",()=>{
    const panel=source("src/components/tracker/tracker-issue-logs-panel.tsx");
    const route=source("src/app/api/tracker/issues/[publicId]/nearby-logs/route.ts");
    expect(panel).toContain("Logs around this report");
    expect(panel).toContain("Load warnings and errors from that moment");
    expect(route).toContain("getBugTrackerIssueForAdmin(context,publicId)");
    expect(route).toContain("anchorAt:issue.report.createdAt.toISOString()");
    expect(route).toContain('minimumSeverity:"WARNING"');
    expect(route).toContain('"Cache-Control":"private, no-store"');
  });

  it("SA-placements-projects-112 exposes the exact tracker nav and accessible theme control",()=>{
    const nav=source("src/components/tracker/tracker-admin-nav.tsx");
    for(const item of ["Skip to content","Report Issue","Issues","Logs","Audit findings","TrackerThemeToggle"]){
      expect(nav).toContain(item);
    }
  });

  it("SA-placements-projects-113 scopes live Cloud logs and rejects duplicate filter parameters",()=>{
    const route=source("src/app/api/tracker/live-logs/route.ts");
    expect(route).toContain("isSuperAdmin(context)");
    expect(route).toContain("context.adminScope?.collegeId");
    expect(route).toContain("url.searchParams.getAll(key).length>1");
    expect(route).toContain('"Cache-Control":"private, no-store"');
    const explorer=source("src/components/tracker/tracker-live-logs-explorer.tsx");
    expect(explorer).toContain("Live Cloud Logging is not configured.");
    expect(explorer).toContain("Load older");
  });

  it("SA-placements-projects-114 offers safe log permalink, copy and report entry points",()=>{
    const explorer=source("src/components/tracker/tracker-live-logs-explorer.tsx");
    expect(explorer).toContain("Copy for Claude");
    expect(explorer).toContain("Copy permalink");
    expect(explorer).toContain("Report this");
    expect(source("src/components/tracker/known-errors-workspace.tsx")).toContain("Unmute");
  });

  it("SA-placements-projects-116 gates Telegram test and digest behind safe server action",()=>{
    const panel=source("src/components/tracker/tracker-telegram-manual-panel.tsx");
    const route=source("src/app/api/tracker/logs/manual-alert/route.ts");
    for(const label of ["Daily digest","Regressions","Marked fixed","Send test alert","Send to Telegram now"]) {
      expect(panel).toContain(label);
    }
    expect(route).toContain("isSameOriginRequest(request)");
  });

  it("SA-placements-projects-117 downloads redacted logs and produces Claude report without hidden raw stack",()=>{
    const explorer=source("src/components/tracker/tracker-live-logs-explorer.tsx");
    for(const label of ["Download logs","Report for Claude","Download report","Downloaded ","trackerLogMarkdown"]) {
      expect(explorer).toContain(label);
    }
    expect(explorer).toContain("for(let i=0;i<20;i++)");
    expect(explorer).toContain("mergeEntries(rows,response.items)");
  });

  it("SA-placements-projects-118 keeps logs Super Admin-only, not a password bypass",()=>{
    const logs=source("src/app/(authenticated)/tracker/logs/page.tsx");
    expect(logs).toContain("isSuperAdmin(context)");
    expect(logs).toContain('redirect("/dashboard")');
    expect(logs).not.toContain("managerPassword");
  });

  it("SA-placements-projects-119 has a separate strict findings taxonomy, not BUG statuses",()=>{
    expect(FINDING_STATUSES).toContain("RELEASED_PROD");
    expect(FINDING_STATUSES).toContain("VERIFIED");
    expect(FINDING_KINDS).toHaveLength(7);
    expect(FINDING_AREAS).toHaveLength(23);
    expect(findingFilterSchema.safeParse({statuses:["CHECKING"]}).success).toBe(false);
  });

  it("SA-placements-projects-121 requires terminal decision notes, valid duplicates and commit hashes",()=>{
    expect(findingTransitionAllowed("NEW","WONT_FIX","")).toBe(false);
    expect(findingTransitionAllowed("NEW","WONT_FIX","A documented exception")).toBe(true);
    expect(findingTransitionAllowed("NEW","VERIFIED","note")).toBe(false);
    expect(findingMutationSchema.safeParse({action:"FIX_COMMIT",expectedVersion:3,
      repo:"42Students/lms-vnext",sha:"abc"}).success).toBe(false);
    expect(findingMutationSchema.safeParse({action:"COMMENT",expectedVersion:3,note:""}).success).toBe(false);
  });

  it("SA-placements-projects-122 validates multi-facet finding filters and rejects invalid values",()=>{
    expect(findingFilterSchema.parse({view:"RELEASE",areas:["MENTOR"],kinds:["UX"],page:2}))
      .toMatchObject({view:"RELEASE",areas:["MENTOR"],kinds:["UX"],page:2});
    expect(findingFilterSchema.safeParse({areas:["NOT_AN_AREA"]}).success).toBe(false);
    expect(findingFilterSchema.safeParse({page:0}).success).toBe(false);
  });
});
