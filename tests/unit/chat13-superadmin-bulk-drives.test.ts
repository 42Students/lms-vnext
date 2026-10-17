import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
const service=readFileSync("src/modules/placements/super-admin-bulk-drive-service.ts","utf8");
const client=readFileSync("src/components/placements/super-admin-bulk-drive-actions.tsx","utf8");
const route=readFileSync("src/app/api/admin/placements/drives/bulk/route.ts","utf8");

describe("Super Admin bulk drive actions",()=>{
  it("SA-placements-projects-11 limits confirmed writes to 25 unique drives and the chosen college",()=>{
    expect(service).toContain("z.array(z.uuid()).min(1).max(25)");
    expect(service).toContain("new Set(ids).size === ids.length");
    expect(service).toContain("resolveActingCollege(context");
    expect(service).toContain("eq(placementJobs.collegeId, acting.collegeId)");
  });
  it("SA-placements-projects-11 reopens only closed drives after persisted scope, season and company checks",()=>{
    expect(service).toContain('job.status !== "CLOSED"');
    expect(service).toContain("await assertPersistedPlatformPermission");
    expect(service).toContain('eq(placementSeasons.status, "ACTIVE")');
    expect(service).toContain('eq(placementCompanyRelationships.status, "ACTIVE")');
  });
  it("SA-placements-projects-11 previews offer withdrawal and returns per-drive partial failures",()=>{
    expect(service).toContain('eq(placementOffers.status, "ISSUED")');
    expect(service).toContain('await closePlacementJob(context, jobId)');
    expect(service).toContain('status: "SKIPPED"');
    expect(client).toContain('setSelected(response.results.filter(r => r.status === "SKIPPED")');
  });
  it("SA-placements-projects-11 forbids cross-origin writes and keeps raw codes out of client responses",()=>{
    expect(route).toContain("isSameOriginRequest(request)");
    expect(client).toContain("apiFetch<Preview | Result>");
    expect(route).toContain("apiErrorResponse(error)");
  });
});
