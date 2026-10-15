import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("registered company sharing SQL couples company links, jobs, actors and audits by tenant",()=>{
 const sql=readFileSync(join(process.cwd(),"drizzle/0077_placement_company_applicant_shares.sql"),"utf8");
 expect(sql).toContain('FOREIGN KEY ("job_id","college_id")');
 expect(sql).toContain('FOREIGN KEY ("created_by_membership_id","college_id")');
 expect(sql).toContain('FOREIGN KEY ("share_id","college_id")');
 expect(sql).toContain("IN ('VIEW','CSV')");
 expect(sql).toContain('"token_hash" varchar(64)');
 expect(sql.indexOf('CREATE UNIQUE INDEX "pcas_share_id_college_uq"')).toBeLessThan(sql.indexOf('"pcas_views_tenant_fk"'));
});
