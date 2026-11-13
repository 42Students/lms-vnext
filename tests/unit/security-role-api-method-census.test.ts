import {describe,expect,it} from "vitest";
import {inventoryApi} from "../../scripts/security/api-method-inventory.mjs";
import {
  ACCOUNT_ROLES,pathReviewFamily,buildRoleApiMethodMatrix,
} from "../../scripts/security/role-api-matrix.mjs";

describe("#101 discover the full API-method x role denominator without false authorization claims",()=>{
  const api=inventoryApi();
  const matrix=buildRoleApiMethodMatrix(api);

  it("enumerates every actual exported HTTP method across all seven account roles",()=>{
    expect(api.summary.route_files).toBeGreaterThan(900);
    expect(api.summary.exported_methods).toBeGreaterThan(1200);
    expect(matrix.routeFiles).toBe(api.summary.route_files);
    expect(matrix.exportedMethods).toBe(api.summary.exported_methods);
    expect(matrix.roles).toEqual([...ACCOUNT_ROLES]);
    expect(matrix.rows).toHaveLength(api.summary.exported_methods*7);
    expect(new Set(matrix.rows.map(row=>row.key+" # "+row.role)).size)
      .toBe(matrix.rows.length);
    for(const method of api.methods){
      const perMethod=matrix.rows.filter(row=>row.key===method.method+" "+method.route);
      expect(perMethod.map(row=>row.role)).toEqual([...ACCOUNT_ROLES]);
    }
  });

  it("preserves unknown allow/deny decisions instead of interpreting path names or static guard calls as authorization",()=>{
    expect(matrix.counts.unverified).toBe(matrix.counts.roleMethodPairs);
    expect(matrix.counts.verifiedAllow).toBe(0);
    expect(matrix.counts.verifiedDeny).toBe(0);
    expect(matrix.rows.every(row=>
      row.verdict==="UNVERIFIED" &&
      row.testedPositive===false && row.testedNegative===false
    )).toBe(true);
    // A route whose implementation calls a permission helper still must
    // prove object/tenant ownership with adversarial runtime witnesses.
    expect(matrix.rows.filter(row=>row.directPermissionEvidence).length).toBeGreaterThan(0);
    expect(matrix.rows.some(row=>!row.directPermissionEvidence)).toBe(true);
  });

  it("distinguishes review queues without calling a prefix an access grant",()=>{
    expect(pathReviewFamily("/api/auth/memberships")).toBe("IDENTITY");
    expect(pathReviewFamily("/api/internal/audit")).toBe("MACHINE_REVIEW");
    expect(pathReviewFamily("/api/placements/tpo/students")).toBe("TPO_REVIEW");
    expect(pathReviewFamily("/api/placements/recruiter/jobs")).toBe("RECRUITER_REVIEW");
    expect(pathReviewFamily("/api/admin/people")).toBe("PLATFORM_REVIEW");
    expect(pathReviewFamily("/api/courses")).toBe("CROSS_ROLE_REVIEW");
    for(const row of matrix.rows){
      expect(row.pathFamily).toBe(pathReviewFamily(row.route));
      expect(row.verdict).toBe("UNVERIFIED");
    }
  });
});
