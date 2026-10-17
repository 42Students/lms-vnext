import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { learnerProjectMobileFilterSummary } from "@/modules/projects/learner-project-mobile-filter-model";
import { compareNumberedTeamProjects } from "@/modules/projects/learner-project-sort-model";
import { learnerProjectListEmptyState } from "@/modules/projects/learner-project-list-empty-model";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("chat-11 learner Projects legacy list behavior", () => {
  it("LEARNER-projects-04 offers only the legacy status choices on desktop and mobile", () => {
    const desktop = source("src/components/projects/project-participant-list-controls.tsx");
    const mobile = source("src/components/projects/learner-project-mobile-filters.tsx");
    expect(desktop).toContain("mentor || learner ? mentorStatusOptions : statusOptions");
    expect(desktop).not.toContain("learner?<><option");
    for (const name of ["Current only", "Active", "In progress", "Ready", "Blocked", "Archived"]) {
      expect(desktop).toContain(name);
      expect(mobile).toContain(name);
    }
    expect(mobile).not.toContain('["PLANNED"');
  });

  it("LEARNER-projects-05 keeps all three page-size choices in sync with the server", () => {
    const mobile = source("src/components/projects/learner-project-mobile-filters.tsx");
    const desktop = source("src/components/projects/project-participant-list-controls.tsx");
    const page = source("src/app/(authenticated)/learn/projects/page.tsx");
    expect(mobile).toContain("[10,25,50]");
    expect(desktop).toContain("[10,25,50]");
    expect(page).toContain("parsed.data === 10 || parsed.data === 50");
    expect(desktop).toContain('+" of "+total+" projects"');
  });

  it("LEARNER-projects-02 and LEARNER-projects-08 preserve card actions and manual progress", () => {
    const page = source("src/app/(authenticated)/learn/projects/page.tsx");
    const cards = source("src/components/projects/project-list.tsx");
    for (const action of ["Update your submission", "Finish your draft submission", "Open blocked work", "Open workspace"]) {
      expect(page).toContain(action);
    }
    expect(page).toContain("?? row.project.progressPercent ?? undefined");
    expect(page).toContain("Admin-reported progress / Manual estimate");
    expect(cards).toContain("item.progressDetail");
  });

  it("LEARNER-projects-06 and LEARNER-projects-07 keep exact empty and numbered-team behavior", () => {
    expect(learnerProjectListEmptyState(0, 0).title).toBe("No projects assigned yet.");
    expect(learnerProjectListEmptyState(2, 0).title).toBe("No projects match these filters.");
    expect(compareNumberedTeamProjects("Team 2", "Team 10")).toBeLessThan(0);
  });

  it("LEARNER-projects-04 shows blocked attention among active mobile filters", () => {
    expect(learnerProjectMobileFilterSummary({ attention: "BLOCKED" }).labels).toContain("Blocked");
    expect(learnerProjectMobileFilterSummary({ attention: "LEARNER_ACTION", pageSize: 10 }).count).toBe(2);
  });

  it("COL-academic-setup-24 retains program form reset and valid page size persistence choices", () => {
    const programs = source("src/components/admin/admin-program-directory.tsx");
    expect(programs).toContain("Go to Departments");
    expect(programs).toContain("Next, create its semesters and batches.");
    expect(programs).toContain('setName("")');
    expect(programs).toContain("{[10, 25, 50, 100].map");
    expect(programs).toContain("[10,25,50,100].includes(size)");
  });
});
