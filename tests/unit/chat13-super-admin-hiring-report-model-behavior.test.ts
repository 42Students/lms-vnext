import {describe,expect,it} from "vitest";
import {
  hiringCompanyRollups,superAdminHiringReportQuery,SUPER_ADMIN_HIRING_EXPORT_CAP,
  COMPANY_HIRING_COLUMNS,type SuperAdminHiringRow,
} from "@/modules/admin-ui/super-admin-hiring-report-model";

const row=(companyId:string,companyName:string,jobId:string,n:number):SuperAdminHiringRow=>({
  companyId,companyName,jobId,jobTitle:jobId,
  totalApplications:n,applied:n+1,shortlisted:n+2,assessment:n+3,
  interview:n+4,offered:n+5,hired:n+6,rejected:n+7,
  withdrawn:n+8,waitlisted:n+9,
});
describe("SA-HIRING-REPORT-MODEL-10 strict filters and reconciled employer totals",()=>{
  it("rejects inverted dates, invalid UUIDs, unknown filters, oversized search and nonsensical dates",()=>{
    for(const query of [
      {appliedFrom:"2026-10-19",appliedTo:"2026-10-18"},
      {appliedFrom:"2026-02-30"},{appliedTo:"2026-00-11"},
      {jobId:"other-college"},{departmentId:"../../../../"},
      {programId:""},{cohortId:"ABC"},
      {q:"x".repeat(101)},{userId:"foreign"}, {appliedFrom:42},
    ]) expect(superAdminHiringReportQuery.safeParse(query).success,JSON.stringify(query)).toBe(false);
    expect(superAdminHiringReportQuery.safeParse({
      appliedFrom:"2024-02-29",appliedTo:"2024-02-29",q:"  Mentor  ",
    })).toMatchObject({success:true});
  });

  it("groups by persisted company ID, not by company label; sums every stage without changing inputs",()=>{
    const original=[row("a","Zen Co","j1",1),row("b","Alpha","j2",10),row("a","Zen Co","j3",2)];
    const snapshot=structuredClone(original);
    const result=hiringCompanyRollups(original);
    expect(result).toHaveLength(2);
    expect(result.map(company=>company.companyName)).toEqual(["Alpha","Zen Co"]);
    const zen=result[1]!;
    expect(zen).toMatchObject({
      totalApplications:3,applied:5,shortlisted:7,assessment:9,interview:11,
      offered:13,hired:15,rejected:17,withdrawn:19,waitlisted:21,
    });
    expect(result[0]!.totalApplications).toBe(10);
    expect(original).toEqual(snapshot);
  });

  it("keeps companies with identical display names separate and caps exports at the documented row limit",()=>{
    const result=hiringCompanyRollups([row("a","Same","j1",2),row("b","Same","j2",3)]);
    expect(result).toHaveLength(2);
    expect(result.map(r=>r.totalApplications).sort((a,b)=>a-b)).toEqual([2,3]);
    expect(hiringCompanyRollups([])).toEqual([]);
    expect(SUPER_ADMIN_HIRING_EXPORT_CAP).toBe(5000);
    expect(COMPANY_HIRING_COLUMNS).toEqual([
      "Company","Drive","Total Applications","Applied","Shortlisted","Assessment",
      "Interview","Offered","Hired","Rejected","Withdrawn","Waitlisted",
    ]);
  });
});
