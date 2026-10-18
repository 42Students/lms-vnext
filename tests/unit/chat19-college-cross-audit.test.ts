import { describe, expect, it, vi } from "vitest";
import {isValidElement,type ReactNode} from "react";
import { readFileSync } from "node:fs";
import { parseCollegeProjectsQuery } from "../../src/modules/projects/college-projects-query-model";

const models=vi.hoisted(()=>({
  context:vi.fn(), college:vi.fn(), snapshots:vi.fn(), templates:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:models.context}));
vi.mock("@/modules/projects/admin-college-scope",()=>({getProjectAdminCollegeId:models.college}));
vi.mock("@/modules/projects/admin-insights-service",()=>({listProjectAdminSnapshots:models.snapshots}));
vi.mock("@/modules/projects/template-service",()=>({listAssignedProjectTemplates:models.templates}));
vi.mock("@/components/projects/project-admin-collection-controls",()=>({
  ProjectAdminFilters:()=>null,ProjectAdminPagination:()=>null,
}));
vi.mock("@/components/projects/project-admin-nav",()=>({ProjectAdminNav:()=>null}));
vi.mock("@/components/projects/project-admin-workspace-list",()=>({
  ProjectAdminWorkspaceList:()=>null,
}));
vi.mock("@/components/projects/project-admin-workspace-page-export",()=>({
  ProjectAdminWorkspacePageExport:()=>null,
}));
import CollegeProjectsPage from "@/app/(authenticated)/college/projects/page";

function nestedText(node:ReactNode):string {
  if(Array.isArray(node))return node.map(nestedText).join(" ");
  if(typeof node==="string"||typeof node==="number")return String(node);
  if(!isValidElement(node))return "";
  return nestedText((node.props as {children?:ReactNode}).children);
}
function listedItems(node:ReactNode):unknown[]|null {
  if(Array.isArray(node)){
    for(const child of node){const result=listedItems(child);if(result)return result;}
    return null;
  }
  if(!isValidElement(node))return null;
  const props=node.props as {basePath?:string;items?:unknown[];children?:ReactNode};
  if(props.basePath==="/college/projects" && Array.isArray(props.items))return props.items;
  return listedItems(props.children);
}

const read = (path: string) => readFileSync(path, "utf8");

describe("chat-19 college UX cross-audit", () => {
  it("COL-XA-08 accepts defaults and bounded, user-visible URL filters", () => {
    const defaults = parseCollegeProjectsQuery({});
    expect(defaults.success).toBe(true);
    if (defaults.success) {
      expect(defaults.data).toEqual({ view: "cards", page: 1, pageSize: 25 });
    }
    const filtered = parseCollegeProjectsQuery({
      q: " Team  ", status: "ARCHIVED", view: "table",
      page: "3", pageSize: "50",
    });
    expect(filtered.success).toBe(true);
    if (filtered.success) {
      expect(filtered.data).toMatchObject({
        q: "Team", status: "ARCHIVED", view: "table", page: 3, pageSize: 50,
      });
    }
    // Current production rejects duplicate query keys instead of choosing
    // one conflicting college/status/search value. Preserve that security
    // boundary explicitly rather than weakening the parser to satisfy a
    // stale first-value test.
    for (const duplicated of [
      {q: [" Team  ", "ignored"]},
      {page: ["3", "50"]},
      {status: ["ARCHIVED", "ACTIVE"]},
    ]) {
      expect(parseCollegeProjectsQuery(duplicated).success).toBe(false);
    }
  });

  it.each([
    { page: "0" },
    { page: "-4" },
    { page: "Infinity" },
    { page: "NaN" },
    { page: "1.5" },
    { page: "999999999" },
    { pageSize: "20000" },
    { pageSize: "-1" },
    { status: "OTHER_COLLEGE" },
    { view: "javascript:alert(1)" },
    { q: "x".repeat(121) },
  ])("COL-XA-08 rejects malformed or hostile project list filters: %j", input => {
    expect(parseCollegeProjectsQuery(input).success).toBe(false);
  });

  it("COL-XA-08 returns recovery UI instead of rendering invalid pagination", () => {
    const page = read("src/app/(authenticated)/college/projects/page.tsx");
    expect(page).toContain("if (!parsed.success)");
    expect(page).toContain('title="Invalid project filters"');
    expect(page).toContain('href="/college/projects"');
    expect(page).not.toMatch(/page:\s*Number\(/);
  });

  it("COL-XA-09 keeps workspaces visible when optional template labels fail", async () => {
    const page = read("src/app/(authenticated)/college/projects/page.tsx");
    expect(page).toContain("const collegeId = getProjectAdminCollegeId(context)");
    expect(page).toContain("if (!collegeId)");
    expect(page).toContain("listProjectAdminSnapshots(context, collegeId, query)");
    expect(page).toContain("listAssignedProjectTemplates(context, collegeId)");
    expect(page).toMatch(/\.catch\(\(\) => \(\{ ok: false as const \}\)\)/);
    expect(page).toContain("Workspaces are still listed");
    expect(page).toContain("const templateTitles = new Map(");
    expect(page).not.toContain("templates.find(");
    // Execute the real async page: an unavailable optional template read
    // must not hide a permitted project or reveal a service exception.
    vi.clearAllMocks();
    const context={user:{id:"actor",platformStatus:"ACTIVE"},membership:{collegeId:"college-a"}};
    const project={id:"project-a",templateId:"template-a",title:"Authorized team project",
      summary:null,status:"ACTIVE",updatedAt:new Date("2026-10-18T10:00:00Z"),
      mentorName:"Mentor",memberCount:3,progressPercent:25,riskReasons:[]};
    models.context.mockResolvedValue(context);
    models.college.mockReturnValue("college-a");
    models.snapshots.mockResolvedValue({items:[project],total:1,page:1,pageSize:25,totalPages:1});
    models.templates.mockRejectedValue(new Error("optional template service is offline"));
    const output=await CollegeProjectsPage({searchParams:Promise.resolve({})});
    const visible=listedItems(output);
    expect(visible).toHaveLength(1);
    expect(visible?.[0]).toMatchObject({id:"project-a",title:"Authorized team project",templateTitle:null});
    expect(nestedText(output)).toContain("Workspaces are still listed");
    expect(nestedText(output)).not.toContain("optional template service is offline");
    expect(models.snapshots).toHaveBeenCalledWith(context,"college-a",
      expect.objectContaining({view:"cards",page:1,pageSize:25}));
    expect(models.templates).toHaveBeenCalledWith(context,"college-a");
  });

  it("COL-XA-07 exposes roster fields and class-move controls in mobile cards", () => {
    const page = read("src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx");
    expect(page).toContain("<DataTable");
    expect(page).toContain('caption="Students in this batch"');
    expect(page).toContain('empty={<p className="text-sm text-muted-foreground">No matching students.</p>}');
    for (const column of ["Name", "Roll Number", "Email", "Current class", "Action"]) {
      expect(page).toContain(`header: "${column}"`);
    }
    expect(page).toContain('mobilePriority: "action"');
    expect(page).toContain("<StudentClassMoveAction");
    expect(page).not.toContain("<table");
    const table = read("src/components/ui/data-table.tsx");
    expect(table).toContain('sm:hidden');
    expect(table).toContain('const visibleOnPhone');
    expect(table).toContain('<ScrollCue axis="x"');
  });
  it("COL-XA-10 rejects invalid cohort identifiers before querying the roster", () => {
    const page = read("src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx");
    expect(page).toContain("z.string().uuid().safeParse(rawId)");
    expect(page).toContain("if (!checkedId.success) notFound()");
    expect(page).toContain("eq(departments.collegeId, context.membership.collegeId)");
    expect(page).toContain("requirePermission(context");
  });

  it("COL-XA-11 uses mobile cards with labelled elective allocation checkboxes", () => {
    const page = read("src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx");
    expect(page).toContain("<DataTable");
    expect(page).toContain('caption="Eligible students for allocation"');
    expect(page).toContain('mobilePriority: "action"');
    expect(page).toContain('mobilePriority: "primary"');
    expect(page).toContain('mobilePriority: "secondary"');
    expect(page).toContain('name="membershipId"');
    expect(page).toContain('empty={<p');
    expect(page).not.toContain("<table");
    expect(page).toContain('<ScrollCue axis="y"');
    expect(page).toContain('viewportClassName="max-h-80"');
    expect(page).toContain('aria-label={"Select "');
  });

  it("COL-XA-12 validates slot and offering before database mutation", () => {
    const page = read("src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx");
    expect(page).toContain("uuid.safeParse(slotId)");
    expect(page).toContain("if (!checkedSlot.success) notFound()");
    expect(page).toContain("uuid.safeParse(groupId)");
    expect(page).toContain("if (!checkedGroup.success) redirect(");
    expect(page).toContain("eq(electiveOfferings.groupId, checkedGroup.data)");
    expect(page).not.toContain("uuid.parse(slotId)");
    expect(page).not.toContain("uuid.parse(groupId)");
  });

  it("COL-XA-13 keeps each faculty assignment field and both guarded actions in mobile cards", () => {
    const source = read("src/app/(authenticated)/college/faculty-assignment/page.tsx");
    expect(source).toContain('caption="Teaching assignment roster"');
    expect(source).toContain("<DataTable");
    for (const key of ["faculty", "course", "class", "period", "role", "active", "actions"]) {
      expect(source).toContain(`key: "${key}"`);
    }
    expect(source).toContain('<CollegeFacultyAssignmentEnd');
    expect(source).toContain('<CollegeFacultyReassignAction');
    expect(source).toContain('mobilePriority: "action"');
    expect(source).not.toContain("<table");
  });

  it("COL-XA-14 keeps faculty assignment detail and history accessible without a wide table", () => {
    const source = read("src/app/(authenticated)/college/faculty/[membershipId]/page.tsx");
    expect(source).toContain('caption="Persisted teaching assignments"');
    for (const key of ["course", "class", "role", "status"]) {
      expect(source).toContain(`key: "${key}"`);
    }
    expect(source).toContain('No college-scoped teaching assignments recorded.');
    expect(source).toContain('mobilePriority: "primary"');
    expect(source).not.toContain("<table");
  });

  it("COL-XA-15 keeps elective roster actions, state and join time visible on phones", () => {
    const source = read("src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx");
    expect(source).toContain('caption="Elective offering roster"');
    expect(source).toContain('mobilePriority: "action"');
    for (const key of ["student", "state", "source", "since", "actions"]) {
      expect(source).toContain(`key: "${key}"`);
    }
    expect(source).toContain('name="confirm"');
    expect(source).toContain('required /> Confirm removal');
    expect(source).toContain('disabled={faculty.length === 0}');
    expect(source).toContain('Archived offerings are read-only.');
    expect(source).not.toContain("<table");
  });

  it("COL-XA-16 stale or malformed elective and membership identifiers fail safely", () => {
    const source = read("src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx");
    expect(source).toContain("uuid.safeParse(slotId)");
    expect(source).toContain("uuid.safeParse(offeringId)");
    expect(source).toContain("if (!parsedSlot.success || !parsedOffering.success) notFound()");
    const parseMembership = source.indexOf('uuid.parse(String(form.get("membershipId")');
    const tryPosition = source.indexOf("    try {", source.indexOf("async function mutate("));
    expect(parseMembership).toBeGreaterThan(tryPosition);
    expect(source).toContain("Could not update this student. Check eligibility and capacity, then try again.");
    expect(source).toContain('eq(electiveSlots.collegeId, context.membership.collegeId)');
  });

  it("UX-college-scroll-motion-01 responsive rosters offer an actual shared scroll cue instead of a hidden scrollbar", () => {
    const tables = [
      "src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx",
      "src/app/(authenticated)/college/faculty-assignment/page.tsx",
      "src/app/(authenticated)/college/faculty/[membershipId]/page.tsx",
      "src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx",
      "src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx",
    ];
    for (const path of tables) {
      const source = read(path);
      expect(source).toContain("<DataTable");
      expect(source).not.toContain("<table");
    }
    const allocation = read(tables[4]);
    expect(allocation).toContain('<ScrollCue axis="y"');
    expect(allocation).toContain('viewportClassName="max-h-80"');
    const shared = read("src/components/ui/data-table.tsx");
    expect(shared).toContain('<ScrollCue axis="x"');
  });

});
