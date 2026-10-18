import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseSuperAdminReadinessParams, visibleReadinessChecks,
} from "@/modules/colleges/admin-readiness-filter";
import {
  evaluateCollegeReadiness, type CollegeReadinessFacts,
} from "@/modules/colleges/readiness-model";
import { readinessRemediationLink } from "@/modules/colleges/readiness-remediation-links";

const source = (p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const complete:CollegeReadinessFacts={
  collegeStatus:"ACTIVE",adminMemberships:1,departments:1,programs:1,cohorts:1,
  enrolledLearners:1,facultyMemberships:1,tpoMemberships:1,activePlacementSeasons:1,
  verifiedPrimaryDomains:1,
};

describe("SA-colleges-readiness-R01 authorized and accurate tenant launch journey",()=>{
  it("rejects invalid/ambiguous URL filters before reading the persisted readiness data",()=>{
    const page=source("src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx");
    const auth=page.indexOf('requirePermission(context,"admin-scope.select")');
    const validate=page.indexOf("parseSuperAdminReadinessParams(raw)");
    const reject=page.indexOf('if(!parsed)return <ErrorState');
    const read=page.indexOf("await getSuperAdminCollegeReadiness(");
    expect(auth).toBeGreaterThan(-1);
    expect(validate).toBeGreaterThan(auth);
    expect(reject).toBeGreaterThan(validate);
    expect(read).toBeGreaterThan(reject);
    expect(page).toContain('title="Invalid readiness filter"');
    expect(page).toContain('description="Choose a supported check status."');
  });

  it("does not silently accept repeated status/area or hidden filter keys",()=>{
    expect(parseSuperAdminReadinessParams({})).toEqual({status:"ALL",area:"ALL"});
    expect(parseSuperAdminReadinessParams({status:"NEEDS_ATTENTION",area:"PEOPLE"}))
      .toEqual({status:"NEEDS_ATTENTION",area:"PEOPLE"});
    for(const query of [
      {status:["PASS","FAIL"]},
      {area:["PEOPLE","DOMAINS"]},
      {status:"READY"},
      {area:"SECURITY"},
      {page:"1"},
      {collegeId:"foreign"},
    ])expect(parseSuperAdminReadinessParams(query)).toBeNull();
  });

  it("treats zero as failed evidence and unavailable as unknown, not ready",()=>{
    const zero=evaluateCollegeReadiness({...complete,facultyMemberships:0});
    expect(zero.overall).toBe("NOT_READY");
    expect(zero.checks.find(x=>x.id==="FACULTY")?.status).toBe("FAIL");
    const unknown=evaluateCollegeReadiness({...complete,facultyMemberships:null});
    expect(unknown.overall).toBe("INCOMPLETE");
    expect(unknown.checks.find(x=>x.id==="FACULTY")?.status).toBe("UNKNOWN");
    expect(unknown.checks.find(x=>x.id==="FACULTY")?.remediation).toContain("Unknown must not be treated as passed");
  });

  it("only marks all ten checks ready with persisted positive evidence",()=>{
    const ready=evaluateCollegeReadiness(complete);
    expect(ready.overall).toBe("READY");
    expect(ready.counts).toEqual({total:10,passed:10,failed:0,unknown:0});
    const archived=evaluateCollegeReadiness({...complete,collegeStatus:"ARCHIVED"});
    expect(archived.overall).toBe("NOT_READY");
    expect(archived.checks.find(x=>x.id==="COLLEGE_ACTIVE")?.status).toBe("FAIL");
  });

  it("filters an already calculated verdict rather than losing unknown/failed signals",()=>{
    const all=evaluateCollegeReadiness({
      ...complete,facultyMemberships:null,activePlacementSeasons:0,
    });
    expect(all.overall).toBe("NOT_READY");
    const need=visibleReadinessChecks(all.checks,"NEEDS_ATTENTION");
    expect(need.map(check=>check.id)).toEqual(["FACULTY","PLACEMENT_SEASON"]);
    expect(visibleReadinessChecks(all.checks,"UNKNOWN","PEOPLE").map(x=>x.id)).toEqual(["FACULTY"]);
    expect(visibleReadinessChecks(all.checks,"FAIL","PLACEMENTS").map(x=>x.id)).toEqual(["PLACEMENT_SEASON"]);
    expect(all.counts).toEqual({total:10,passed:8,failed:1,unknown:1});
  });

  it("routes domain remediation to the selected college and ordinary checks to admin sections",()=>{
    const id="40000000-0000-4000-8000-000000000001";
    expect(readinessRemediationLink("TENANT_DOMAIN",id)).toBe("/admin/colleges/"+id+"/subdomain");
    expect(readinessRemediationLink("FACULTY",id)).toBe("/admin/faculty");
    expect(readinessRemediationLink("PROGRAMS",id)).toBe("/admin/programs");
  });
});
