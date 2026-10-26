import {expect,test,type BrowserContext} from "@playwright/test";
import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME}
 from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const origin="http://localhost:3000";
const secret=process.env.E2E_AUTH_SECRET;

/** Real authenticated routes: neither the visual screenshot gate nor a mock
 * successful mutation. Skip detail assertions when seed has no owned project. */
async function signIn(
 context:BrowserContext,user:string,membershipId:string,
 role:"MENTOR"|"LEARNER"|"FACULTY"|"COLLEGE_ADMIN"="MENTOR",
) {
 if(!secret)throw new Error("E2E_AUTH_SECRET is required");
 await context.clearCookies();
 await context.addCookies([
  {name:E2E_IDENTITY_COOKIE_NAME,value:user,url:origin,httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret,url:origin,httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:membershipId,url:origin,httpOnly:true,sameSite:"Lax"},
  {name:"lms_role",value:role,url:origin,httpOnly:true,sameSite:"Lax"},
 ]);
}

test.describe("Mentor #45–56 source-functional route matrix",()=>{
 test.skip(!secret,"Requires authenticated disposable Mentor seed");

 test("mentor portfolio and cross-team surfaces respond to the authenticated role",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  for(const [path,heading] of [
   ["/mentor/projects","__DYNAMIC_MENTOR_ATTENTION_HEADING__"],
   ["/mentor/calendar","Meetings"],
   ["/mentor/notifications","Notifications"],
   ["/mentor/search","Search"],
   ["/mentor/account","Mentor · My account"],
  ] as const){
   await page.goto(path);
   if(heading==="__DYNAMIC_MENTOR_ATTENTION_HEADING__")
    await expect(page.locator(".prototype-mentor-home-heading h1")).toBeVisible();
   else await expect(page.getByRole("heading",{level:1,name:heading})).toBeVisible();
   await expect(page.locator("body")).not.toContainText("Application error: a server-side exception");
  }
 });

 test("each of the seven prototype project tabs renders from an authorized project",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects");
  const paths=await page.locator("a[href^='/mentor/projects/']").evaluateAll(nodes=>
   nodes.map(node=>node.getAttribute("href")??"")
    .map(href=>href.split("?")[0]??"")
    .filter(href=>/^\/mentor\/projects\/[0-9a-f-]{36}$/i.test(href)),
  );
  const project=[...new Set(paths)][0];
  // An isolated Mentor CI run must exercise all seven tabs, never skip.
  if(!project&&process.env["MENTOR_E2E_SEED_PROJECT"]==="true")
    throw new Error("The persisted Mentor acceptance project was not found.");
  test.skip(!project,"No assigned Mentor project in disposable seed");
  const base=project!;
  const tabs=[
   ["overview","Overview"],["board","Board"],["sprints","Sprints & releases"],
   ["team","Team & meetings"],["performance","Performance"],
   ["resources","Resources"],["activity","Activity"],
  ] as const;
  for(const [key,label] of tabs){
   await page.goto(base+"?tab="+key);
   await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
   await expect(page.getByRole("navigation",{name:"Project sections"})
    .getByRole("link",{name:label,exact:true})).toHaveAttribute("aria-current","page");
   await expect(page.getByText("No project content available for this section."))
    .toHaveCount(0);
  }
  // Screen #53 is a separate final-delivery state beyond the seven tabs.
  await page.goto(base+"?tab=delivery");
  await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
  await expect(page.getByText("No project content available for this section."))
   .toHaveCount(0);
  await expect(page.locator("body"))
   .not.toContainText("Application error: a server-side exception");
  await page.goto(base+"?tab=tasks");
  await expect(page).toHaveURL(base+"?tab=board");
  await page.goto(base+"?tab=meetings");
  await expect(page).toHaveURL(base+"?tab=team");
  await page.goto(base+"?tab=definitely-invalid");
  await expect(page.getByText("No project content available for this section."))
    .toBeVisible();
 });

 test("archived Mentor workspace stays readable but rejects team writes",async({page,context})=>{
  // Use a fresh, independently named project so parallel browser tests cannot
  // mutate the shared Mentor acceptance fixture or each other's team state.
  await signIn(context,"seed-college-admin",SEED_IDS.collegeAdminMembership,"COLLEGE_ADMIN");
  await page.goto("/college/projects/create");
  const form=page.getByRole("region",{name:"Create workspace"});
  const template=form.getByLabel("Template",{exact:true});
  await template.selectOption({index:1});
  const templateId=await template.inputValue();
  expect(templateId).toMatch(/^[0-9a-f-]{36}$/i);
  const unique=Date.now().toString();
  const title="Mentor Archive Browser "+unique;
  const created=await page.request.post("/api/projects",{
   headers:{Origin:origin},
   data:{collegeId:SEED_IDS.collegeA,templateId,title,
    slug:"mentor-archive-browser-"+unique,initialStatus:"ACTIVE",
    primaryMentorMembershipId:SEED_IDS.facultyCollegeAMembership,
    learnerMembershipIds:[SEED_IDS.learnerCollegeAMembership]},
  });
  expect(created.status()).toBe(201);
  const creation=await created.json() as {project?:{id?:string;updatedAt?:string}};
  const projectId=creation.project?.id;
  const expectedUpdatedAt=creation.project?.updatedAt;
  expect(projectId).toMatch(/^[0-9a-f-]{36}$/i);
  expect(expectedUpdatedAt).toBeTruthy();
  // Real active project: shared prototype controls must open scoped dialogs.
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  const activeBase="/mentor/projects/"+projectId;
  await page.goto(activeBase+"?tab=overview");
  const header=page.locator(".prototype-mentor-header-actions");
  await header.getByRole("button",{name:"Create task"}).click();
  const taskDialog=page.getByRole("dialog",{name:"Confirm new task"});
  await expect(taskDialog).toBeVisible();
  await taskDialog.getByRole("button",{name:"Cancel"}).click();
  await header.getByRole("button",{name:"Schedule a meeting"}).click();
  const meetingDialog=page.getByRole("dialog",{name:"Schedule a meeting"});
  await expect(meetingDialog).toBeVisible();
  await expect(meetingDialog.getByLabel(/Physical venue/)).toBeVisible();
  await meetingDialog.getByRole("button",{name:"Cancel"}).click();
  await page.goto(activeBase+"?tab=sprints");
  const detail=page.getByRole("region",{name:"Detailed sprint plan"});
  await expect(detail).toBeVisible();
  await detail.getByLabel("Filter sprint state").selectOption("PLANNED");
  await expect(detail.getByLabel("Filter sprint state")).toHaveValue("PLANNED");
  await signIn(context,"seed-college-admin",SEED_IDS.collegeAdminMembership,"COLLEGE_ADMIN");
  const archive=await page.request.post("/api/projects/"+projectId+"/archive",{
   headers:{Origin:origin},data:{expectedUpdatedAt},
  });
  expect(archive.status()).toBe(200);
  const archived=await archive.json() as {project?:{status?:string}};
  expect(archived.project?.status).toBe("ARCHIVED");

  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  const base="/mentor/projects/"+projectId;
  await page.goto(base+"?tab=team");
  await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
  await expect(page.locator(".prototype-mentor-title-line")).toContainText("Archived");
  await expect(page.getByRole("region",{name:"Current project team"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Add student"})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Promote lead"})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Edit role"})).toHaveCount(0);
  const denied=await page.request.post("/api/projects/"+projectId+"/members",{
   headers:{Origin:origin},
   data:{membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER"},
  });
  expect(denied.status()).toBe(409);
  expect((await denied.json() as {error?:string}).error).toBe("PROJECT_INVALID_STATE");
  await page.goto(base+"?tab=overview");
  await expect(page.getByRole("link",{name:/Edit project brief/})).toHaveCount(0);
  await page.goto(base+"?tab=sprints");
  await expect(page.getByRole("region",{name:"Plan a release or sprint"})).toHaveCount(0);
 });

 test("persisted Mentor brief rejects stale tabs and cross-role mutations",async({page,context})=>{
  await signIn(context,"seed-college-admin",SEED_IDS.collegeAdminMembership,"COLLEGE_ADMIN");
  await page.goto("/college/projects/create");
  const template=page.getByRole("region",{name:"Create workspace"})
   .getByLabel("Template",{exact:true});
  await template.selectOption({index:1});
  const templateId=await template.inputValue();
  expect(templateId).toMatch(/^[0-9a-f-]{36}$/i);
  const unique=Date.now()+"-"+Math.random().toString(16).slice(2,10);
  const created=await page.request.post("/api/projects",{
   headers:{Origin:origin},
   data:{collegeId:SEED_IDS.collegeA,templateId,
    title:"Mentor CAS "+unique,slug:"mentor-cas-"+unique,
    initialStatus:"PLANNED",
    primaryMentorMembershipId:SEED_IDS.facultyCollegeAMembership,
    learnerMembershipIds:[SEED_IDS.learnerCollegeAMembership]},
  });
  expect(created.status()).toBe(201);
  const {project}=await created.json() as {project:{id:string;updatedAt:string}};
  expect(project.id).toMatch(/^[0-9a-f-]{36}$/i);
  const path="/api/projects/"+project.id+"/brief";
  const brief={goal:"Persist Mentor review",description:"Durable Mentor-authored project plan",
   deliverables:["Reviewed acceptance evidence"],completionConditions:["Team may verify"],
   personas:["Mentor","Learner"]};
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  const saved=await page.request.patch(path,{
   headers:{Origin:origin},data:{expectedUpdatedAt:project.updatedAt,brief},
  });
  expect(saved.status()).toBe(200);
  const updated=await saved.json() as {project:{updatedAt:string}};
  expect(updated.project.updatedAt).not.toBe(project.updatedAt);
  const load=await page.request.get("/api/projects/"+project.id);
  expect(load.status()).toBe(200);
  const persisted=await load.json() as {workspace:{project:{authoredBrief:unknown}}};
  expect(persisted.workspace.project.authoredBrief).toMatchObject(brief);
  // A stale concurrent tab must not overwrite the persisted earlier save.
  const stale=await page.request.patch(path,{
   headers:{Origin:origin},
   data:{expectedUpdatedAt:project.updatedAt,brief:{...brief,goal:"Stale overwrite"}},
  });
  expect(stale.status()).toBe(409);
  expect((await stale.json() as {error:string}).error).toBe("PROJECT_SUBMISSION_CONFLICT");
  // A real assigned Learner has read access, not lifecycle write authority.
  await signIn(context,"seed-learner",SEED_IDS.learnerCollegeAMembership,"LEARNER");
  const learnerDenied=await page.request.patch(path,{
   headers:{Origin:origin},
   data:{expectedUpdatedAt:updated.project.updatedAt,brief},
  });
  expect(learnerDenied.status()).toBe(403);
  expect((await learnerDenied.json() as {error:string}).error)
   .toBe("PROJECT_LIFECYCLE_ACCESS_DENIED");
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeBMembership,"FACULTY");
  const foreignDenied=await page.request.patch(path,{
   headers:{Origin:origin},
   data:{expectedUpdatedAt:updated.project.updatedAt,brief},
  });
  expect(foreignDenied.status()).toBe(403);
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  const unchanged=await page.request.get("/api/projects/"+project.id);
  expect(unchanged.status()).toBe(200);
  const state=await unchanged.json() as {
   workspace:{project:{updatedAt:string;authoredBrief:{goal:string}}}};
  expect(state.workspace.project.updatedAt).toBe(updated.project.updatedAt);
  expect(state.workspace.project.authoredBrief.goal).toBe(brief.goal);
 });

 test("140 persisted activity changes stay countable beyond the 100-event snapshot and denied across colleges",async({page,context})=>{
  const connection=process.env.E2E_DATABASE_URL||process.env.DATABASE_URL;
  if(!connection)throw new Error("Disposable authenticated Mentor browser database is required");
  // Own project, unique fixture and isolated DB rows: parallel Mentor tests
  // must never depend on or mutate the shared acceptance seed project.
  await signIn(context,"seed-college-admin",SEED_IDS.collegeAdminMembership,"COLLEGE_ADMIN");
  await page.goto("/college/projects/create");
  const template=page.getByRole("region",{name:"Create workspace"})
    .getByLabel("Template",{exact:true});
  await template.selectOption({index:1});
  const templateId=await template.inputValue();
  expect(templateId).toMatch(/^[0-9a-f-]{36}$/i);
  const unique=randomUUID();
  const title="Mentor activity complete history "+unique;
  const created=await page.request.post("/api/projects",{
    headers:{Origin:origin},
    data:{collegeId:SEED_IDS.collegeA,templateId,title,
      slug:"mentor-activity-"+unique,initialStatus:"ACTIVE",
      primaryMentorMembershipId:SEED_IDS.facultyCollegeAMembership,
      learnerMembershipIds:[SEED_IDS.learnerCollegeAMembership]},
  });
  expect(created.status()).toBe(201);
  const response=await created.json() as {project?:{id?:string}};
  const projectId=response.project?.id;
  expect(projectId).toMatch(/^[0-9a-f-]{36}$/i);
  const ids=Array.from({length:140},()=>randomUUID());
  const db=new Pool({connectionString:connection});
  try{
    // Data is genuine persisted audit evidence. No server or UI mocking.
    await db.query(`insert into activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,
       subject_type,subject_id,summary,occurred_at)
      select id,$2,$3,$4,'PROJECTS','projects.resource.deleted',
             'project',$5,'Full history resource deletion',
             clock_timestamp()-interval '2 minutes'
      from unnest($1::uuid[]) as x(id)`,
      [ids,SEED_IDS.organization,SEED_IDS.collegeA,
       SEED_IDS.superAdminUser,projectId]);
  }finally{
    await db.end();
  }
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects/"+projectId+"?tab=activity");
  await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
  const group=page.getByRole("group",{name:"All recorded resource changes"});
  await expect(group).toBeVisible();
  await expect(group).toContainText("140");
  // Must show a complete seven-day count, not only the first 100 loaded events.
  const summary=page.locator(".prototype-mentor-activity-summary");
  await expect(summary).toContainText(/recorded events?/);
  await expect(summary).toContainText("140");
  const history=await page.request.get("/api/projects/"+projectId+
    "/activity?category=RESOURCE&resourceAction=Removed&size=100");
  expect(history.status()).toBe(200);
  const first=await history.json() as {events:{id:string}[];hasMore:boolean;
    nextCursor:{time:string;id:string}|null};
  expect(first.events).toHaveLength(100);
  expect(first.hasMore).toBe(true);
  expect(first.nextCursor).toBeTruthy();
  const older=new URLSearchParams({category:"RESOURCE",resourceAction:"Removed",
    size:"100",beforeTime:first.nextCursor!.time,beforeId:first.nextCursor!.id});
  const continuation=await page.request.get("/api/projects/"+projectId+
    "/activity?"+older.toString());
  expect(continuation.status()).toBe(200);
  const second=await continuation.json() as {events:{id:string}[];hasMore:boolean};
  expect(second.events).toHaveLength(40);
  expect(second.hasMore).toBe(false);
  expect(new Set([...first.events,...second.events].map(item=>item.id)).size).toBe(140);
  // Same identity, wrong college grant: neither history nor route may leak.
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeBMembership,"FACULTY");
  const forbidden=await page.request.get("/api/projects/"+projectId+"/activity");
  expect(forbidden.status()).toBe(403);
  await page.goto("/mentor/projects/"+projectId+"?tab=activity");
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  await expect(page.locator("body")).not.toContainText(title);
  // Revocation must be re-checked against persisted project membership,
  // even if the faculty account still has a valid MENTOR role cookie.
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  const revocationDb=new Pool({connectionString:connection});
  try{
    const revoked=await revocationDb.query(
      "update project_members set ended_at=clock_timestamp() "+
      "where project_id=$1 and membership_id=$2 and ended_at is null returning id",
      [projectId,SEED_IDS.facultyCollegeAMembership],
    );
    expect(revoked.rowCount).toBe(1);
  }finally{
    await revocationDb.end();
  }
  const revokedHistory=await page.request.get("/api/projects/"+projectId+
    "/activity?category=RESOURCE");
  expect(revokedHistory.status()).toBe(403);
  await page.goto("/mentor/projects/"+projectId+"?tab=activity");
  await expect(page.getByRole("heading",{level:1,name:title})).toHaveCount(0);
 });

 test("in-person Mentor meeting saves physical venue, enforces CAS and denies Learner writes",async({page,context})=>{
  await signIn(context,"seed-college-admin",SEED_IDS.collegeAdminMembership,"COLLEGE_ADMIN");
  await page.goto("/college/projects/create");
  const template=page.getByRole("region",{name:"Create workspace"})
    .getByLabel("Template",{exact:true});
  await template.selectOption({index:1});
  const templateId=await template.inputValue();
  const unique=randomUUID();
  const title="Mentor venue browser "+unique;
  const created=await page.request.post("/api/projects",{
    headers:{Origin:origin},
    data:{collegeId:SEED_IDS.collegeA,templateId,title,
      slug:"mentor-venue-"+unique,initialStatus:"ACTIVE",
      primaryMentorMembershipId:SEED_IDS.facultyCollegeAMembership,
      learnerMembershipIds:[SEED_IDS.learnerCollegeAMembership]},
  });
  expect(created.status()).toBe(201);
  const project=await created.json() as {project?:{id?:string;updatedAt?:string}};
  const projectId=project.project?.id;
  expect(project.project?.updatedAt).toBeTruthy();
  expect(projectId).toMatch(/^[0-9a-f-]{36}$/i);
  const path="/api/projects/"+projectId+"/meetings";
  // Independent starts per retry prevent a successful earlier attempt or
  // a parallel test's organizer lock from causing false double-booking.
  const start=new Date(Date.now()+
    (35+parseInt(unique.slice(0,4),16))*86400000);
  start.setUTCHours(8,0,0,0);
  const window={
    title:"In-person project review",agenda:"Review team work",
    startsAt:start.toISOString(),
    endsAt:new Date(start.getTime()+30*60_000).toISOString(),
    timeZone:"Asia/Kolkata",meetingUrl:null,location:"Lab 2",
    expectedProjectUpdatedAt:project.project!.updatedAt!,
  };
  await signIn(context,"seed-learner",SEED_IDS.learnerCollegeAMembership,"LEARNER");
  const denied=await page.request.post(path,{headers:{Origin:origin},data:window});
  expect(denied.status()).toBe(403);
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  const save=await page.request.post(path,{headers:{Origin:origin},data:window});
  expect(save.status()).toBe(201);
  const body=await save.json() as {meeting?:{
    id:string;status:string;meetingUrl:string|null;agenda:string;updatedAt:string;
  }};
  const meeting=body.meeting;
  expect(meeting?.status).toBe("SCHEDULED");
  expect(meeting?.meetingUrl).toBeNull();
  expect(meeting?.agenda).toBe("Location: Lab 2\nReview team work");
  expect(meeting?.id).toMatch(/^[0-9a-f-]{36}$/i);
  await page.goto("/mentor/projects/"+projectId+"?tab=team");
  await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
  await expect(page.getByText("Lab 2",{exact:false}).first()).toBeVisible();
  const saved=await page.request.get(path);
  expect(saved.status()).toBe(200);
  const rows=await saved.json() as {meetings:{id:string;agenda:string}[]};
  expect(rows.meetings.find(row=>row.id===meeting!.id)?.agenda)
    .toBe("Location: Lab 2\nReview team work");
  const move={...window,startsAt:new Date(start.getTime()+60*60_000).toISOString(),
    endsAt:new Date(start.getTime()+90*60_000).toISOString(),status:"RESCHEDULED",
    location:"Room 304",expectedUpdatedAt:meeting!.updatedAt};
  const moved=await page.request.patch(path+"/"+meeting!.id,{
    headers:{Origin:origin},data:move,
  });
  expect(moved.status()).toBe(200);
  const latest=await moved.json() as {meeting:{agenda:string;updatedAt:string}};
  expect(latest.meeting.agenda).toBe("Location: Room 304\nReview team work");
  const stale=await page.request.patch(path+"/"+meeting!.id,{
    headers:{Origin:origin},data:{...move,location:"Wrong room"},
  });
  expect(stale.status()).toBe(409);
  const after=await page.request.get(path);
  const actual=await after.json() as {meetings:{id:string;agenda:string}[]};
  expect(actual.meetings.find(row=>row.id===meeting!.id)?.agenda)
    .toBe("Location: Room 304\nReview team work");
 });

 test("a learner cannot open any Mentor route, including deep-linked project tabs",async({page,context})=>{
  await signIn(context,"seed-learner",SEED_IDS.learnerCollegeAMembership,"LEARNER");
  for(const path of ["/mentor/projects","/mentor/calendar",
    "/mentor/notifications","/mentor/search",
    "/mentor/projects/00000000-0000-4000-8000-000000000001?tab=board",
    "/mentor/projects/00000000-0000-4000-8000-000000000001/board-review"]){
   await page.goto(path);
   await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
   await expect(page.getByRole("heading",{level:1,name:"Dashboard"})).toBeVisible();
   await expect(page.locator("body"))
    .not.toContainText("Application error: a server-side exception");
  }
 });

 test("a planned Mentor project shows read-only overview and sprint planning states",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects");
  const link=page.getByRole("link",{name:/E2E Mentor Acceptance Project.*Open project/}).first();
  if(process.env["MENTOR_E2E_SEED_PROJECT"]==="true")
   await expect(link).toBeVisible();
  else test.skip((await link.count())===0,"Requires the disposable Mentor acceptance project");
  const href=await link.getAttribute("href");
  expect(href).toMatch(/^\/mentor\/projects\/[0-9a-f-]{36}(?:\?.*)?$/i);
  const base=href!.split("?")[0]!;
  await page.goto(base+"?tab=overview");
  await expect(page.getByRole("heading",{level:1,name:"E2E Mentor Acceptance Project"})).toBeVisible();
  await expect(page.locator(".prototype-mentor-title-line")).toContainText("Planned");
  await expect(page.getByRole("link",{name:/Edit project brief/})).toHaveCount(0);
  await page.goto(base+"?tab=sprints");
  await expect(page.getByRole("navigation",{name:"Project sections"})
   .getByRole("link",{name:"Sprints & releases",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByRole("region",{name:"Plan a release or sprint"})).toHaveCount(0);
  await expect(page.getByRole("region",{name:"Sprint and release totals"})).toBeVisible();
 });

 test("a Faculty-only college switch cannot inherit the same user's other college Mentor grant",async({page,context})=>{
  // Deny an actual persisted College A project rather than only a synthetic UUID.
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects");
  const ownProject=page.getByRole("link",{name:/E2E Mentor Acceptance Project.*Open project/}).first();
  if(process.env["MENTOR_E2E_SEED_PROJECT"]==="true")
   await expect(ownProject).toBeVisible();
  else test.skip((await ownProject.count())===0,"Requires the disposable Mentor acceptance project");
  const projectHref=await ownProject.getAttribute("href");
  expect(projectHref).toMatch(/^\/mentor\/projects\/[0-9a-f-]{36}(?:\?.*)?$/i);
  const foreignProjectPath=projectHref!.split("?")[0]!+"?tab=team";
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeBMembership,"FACULTY");
  for(const path of ["/mentor/projects","/mentor/calendar",
    "/mentor/notifications","/mentor/search",
    foreignProjectPath]){
   await page.goto(path);
   await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  }
 });

 test("invalid project and notification filters offer an authorized clear path",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects?page=-1");
  await expect(page.getByText("Invalid Project filters")).toBeVisible();
  await expect(page.getByRole("link",{name:"Clear filters"}))
   .toHaveAttribute("href","/mentor/projects");
  await page.goto("/mentor/notifications?kind=INVALID");
  await expect(page.getByRole("heading",{name:"Invalid notification filters"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Return to newest notifications"}))
   .toHaveAttribute("href","/mentor/notifications");
 });

 test("malformed calendar filters fail recoverably for an authenticated Mentor",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/calendar?period=INVALID");
  await expect(page.getByRole("heading",{name:"Invalid meeting filters"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Clear filters"}))
   .toHaveAttribute("href","/mentor/calendar");
  await expect(page.locator("body"))
   .not.toContainText("Application error: a server-side exception");
 });
});
