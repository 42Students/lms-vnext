import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Mentor resources and delivery complete source contracts", () => {
  it("MEN-projects-meetings-53 persists resource metadata and associated sprint/task IDs", () => {
    const control = source("src/components/projects/project-resource-controls.tsx");
    const service = source("src/modules/projects/resource-service.ts");
    for (const field of ["resourceType", "status", "pinned", "accessNotes", "sprintId", "taskId"]) {
      expect(control).toContain(field);
      expect(service).toContain(field);
    }
    expect(service).toContain("associated.sprintId!==input.sprintId");
    expect(service).toContain("eq(projectSprints.projectId,scope.project.id)");
    expect(control).toContain("Related sprint");
    expect(control).toContain("Related task");
  });

  it("MEN-projects-meetings-55 defaults to active and exposes all legacy resource filters", () => {
    const list = source("src/components/projects/project-resource-list.tsx");
    expect(list).toContain('const [status,setStatus]=useState("ACTIVE")');
    for (const label of ["All types", "All statuses", "All sprints", "All tasks",
      "Clear filters", "Pinned only", "Showing", "Files", "Links", "Other"]) {
      expect(list).toContain(label);
    }
    expect(list).toContain('aria-label="Search resources"');
    expect(list).toContain("row.sprintId===sprint");
    expect(list).toContain("row.taskId===task");
    expect(list).toContain('resource.status==="DRAFT"?"Draft":"Active"');
  });

  it("MEN-projects-meetings-56 reorders active resources and keeps a safe error fallback", () => {
    const list = source("src/components/projects/project-resource-list.tsx");
    const service = source("src/modules/projects/resource-service.ts");
    const route = source("src/app/api/projects/[projectId]/resources/reorder/route.ts");
    expect(list).toContain("onDragStart");
    expect(list).toContain("onDrop");
    expect(list).toContain("Move up");
    expect(list).toContain("Move down");
    expect(list).toContain("Resource order could not be saved. Try again.");
    expect(service).toContain("export async function reorderProjectResources");
    expect(service).toContain('status==="ACTIVE"');
    expect(route).toContain("isSameOriginRequest(request)");
  });

  it("MEN-projects-meetings-63 protects mentor delivery locking and persists history", () => {
    const ui = source("src/components/projects/mentor-delivery-lock-control.tsx");
    const route = source("src/app/api/projects/[projectId]/submissions/[submissionId]/mentor-lock/route.ts");
    const service = source("src/modules/projects/mentor-delivery-lock-service.ts");
    expect(ui).toContain("Lock submission");
    expect(ui).toContain("expectedUpdatedAt");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(service).toContain('scope.access!=="MENTOR"');
    expect(service).toContain('eventType:"LOCKED"');
    expect(service).toContain("notifyActiveProjectMembers");
    expect(source("src/components/projects/project-workspace.tsx")).toContain("<MentorDeliveryLockControl");
  });
});
