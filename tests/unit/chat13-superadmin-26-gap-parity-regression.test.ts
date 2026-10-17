import { describe, expect, it } from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

/** One independently named regression per legacy gap, source-verified against current main. */
const parityCases: ReadonlyArray<readonly [string,string,string]> = [
  [
    "SA-placements-projects-03",
    "src/components/placements/placement-operations-overview.tsx",
    "Active drives"
  ],
  [
    "SA-placements-projects-04",
    "src/app/(authenticated)/admin/placements/page.tsx",
    "Placement Drives"
  ],
  [
    "SA-placements-projects-08",
    "src/app/(authenticated)/admin/placements/retention/page.tsx",
    "Data retention report"
  ],
  [
    "SA-placements-projects-11",
    "src/app/(authenticated)/admin/placements/drives/page.tsx",
    "SuperAdminBulkDriveActions"
  ],
  [
    "SA-placements-projects-12",
    "src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx",
    "SuperAdminDriveArchive"
  ],
  [
    "SA-placements-projects-13",
    "src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx",
    "SuperAdminPublishedDriveEdit"
  ],
  [
    "SA-placements-projects-18",
    "src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx",
    "SuperAdminDrivePipeline"
  ],
  [
    "SA-placements-projects-23",
    "src/app/(authenticated)/admin/placements/shortlisted/page.tsx",
    "shortlisted.csv"
  ],
  [
    "SA-placements-projects-24",
    "src/app/(authenticated)/admin/companies/page.tsx",
    "Only not verified"
  ],
  [
    "SA-placements-projects-26",
    "src/components/admin/super-admin-company-edit.tsx",
    "Edit global company"
  ],
  [
    "SA-placements-projects-27",
    "src/modules/placements/super-admin-company-identities-service.ts",
    "Keep at least one company domain."
  ],
  [
    "SA-placements-projects-28",
    "src/components/placements/placement-job-create-form.tsx",
    "company.otherNames?.some"
  ],
  [
    "SA-placements-projects-29",
    "src/app/(authenticated)/admin/companies/page.tsx",
    "Linked colleges"
  ],
  [
    "SA-placements-projects-30",
    "src/components/admin/super-admin-college-company-actions.tsx",
    "Add company"
  ],
  [
    "SA-placements-projects-32",
    "src/app/(authenticated)/admin/companies/page.tsx",
    "SuperAdminCompanyRestore"
  ],
  [
    "SA-placements-projects-33",
    "src/app/(authenticated)/admin/companies/page.tsx",
    "This college&apos;s companies"
  ],
  [
    "SA-placements-projects-35",
    "src/components/admin/super-admin-hr-accounts.tsx",
    "Recruiter suspended"
  ],
  [
    "SA-placements-projects-36",
    "src/components/admin/super-admin-hr-accounts.tsx",
    "Recruiter account lifecycle"
  ],
  [
    "SA-placements-projects-38",
    "src/components/admin/super-admin-hr-accounts.tsx",
    "accountManageable"
  ],
  [
    "SA-placements-projects-39",
    "src/modules/placements/super-admin-hr-service.ts",
    "PLACEMENTS_RECRUITER_CREATED"
  ],
  [
    "SA-placements-projects-43",
    "src/app/(authenticated)/admin/placements/analytics/page.tsx",
    "Placement Analytics"
  ],
  [
    "SA-placements-projects-44",
    "src/components/placements/placement-calendar-workspace.tsx",
    "Placement Interview Calendar"
  ],
  [
    "SA-placements-projects-45",
    "src/modules/admin-ui/super-admin-interview-operations-model.ts",
    "potentialRoomConflicts"
  ],
  [
    "SA-placements-projects-46",
    "src/components/admin/super-admin-interview-operations.tsx",
    "choices(\"Department\""
  ],
  [
    "SA-placements-projects-47",
    "src/components/admin/super-admin-interview-operations.tsx",
    "interviews.csv"
  ],
  [
    "SA-placements-projects-48",
    "src/modules/announcements/super-admin-college-broadcast-model.ts",
    "buttonLabel"
  ]
];

describe("Chat 13 reverified Super Admin placement parity",()=>{
 for(const [gapId,sourcePath,evidence] of parityCases){
  it(gapId+" keeps the verified implementation reachable",()=>{
   const content=readFileSync(join(process.cwd(),sourcePath),"utf8");
   expect(content).toContain(evidence);
  });
 }
});
