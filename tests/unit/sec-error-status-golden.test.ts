import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/observability/logger", () => ({ logError: () => {} }));

import { apiErrorResponse } from "@/lib/api-error";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { ActivityServiceError } from "@/modules/activity/errors";
import { AdminScopeServiceError } from "@/modules/admin-scope/service";
import { CollegeServiceError } from "@/modules/colleges/service";
import { CoursesServiceError } from "@/modules/courses/errors";
import { DepartmentServiceError } from "@/modules/departments/service";
import { OrganizationServiceError } from "@/modules/organizations/service";
import { PeopleServiceError } from "@/modules/people/errors";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { TenantDomainServiceError } from "@/modules/tenant-domains/service";
import { ERROR_CODE_UNIVERSE } from "@/lib/error-registry";

/**
 * Golden record of the HTTP status the central mapper gives each service error code, per error family. The record was taken
 * from the hand-written if-chains before the mapper was rebuilt on the registry, so the rebuild is proven not to move a code.
 * Update (deliberately, with a reviewer) with UPDATE_GOLDEN=1.
 */
const GOLDEN = path.join(process.cwd(), "tests/unit/__golden__/error-status.json");
const FAMILIES: Record<string, new (code: never) => Error> = {
  department: DepartmentServiceError as never,
  organization: OrganizationServiceError as never,
  college: CollegeServiceError as never,
  academics: AcademicsServiceError as never,
  courses: CoursesServiceError as never,
  projects: ProjectsServiceError as never,
  placements: PlacementsServiceError as never,
  activity: ActivityServiceError as never,
  adminScope: AdminScopeServiceError as never,
  tenantDomain: TenantDomainServiceError as never,
  people: PeopleServiceError as never,
};

describe("service error status table", () => {
  it("gives every known code the same HTTP status as the recorded mapper", async () => {
    const actual: Record<string, Record<string, number>> = {};
    for (const [family, Ctor] of Object.entries(FAMILIES)) {
      actual[family] = {};
      for (const code of [...ERROR_CODE_UNIVERSE, "UNLISTED_CODE_FOR_DEFAULT"]) {
        const response = apiErrorResponse(new Ctor(code as never));
        actual[family]![code] = response.status;
      }
    }
    if (process.env["UPDATE_GOLDEN"] === "1" || !existsSync(GOLDEN)) {
      mkdirSync(path.dirname(GOLDEN), { recursive: true });
      writeFileSync(GOLDEN, JSON.stringify(actual, null, 1) + "\n");
    }
    expect(actual).toEqual(JSON.parse(readFileSync(GOLDEN, "utf8")));
  });
});
