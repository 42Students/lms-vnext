import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("proposed company sharing SQL couples company links, jobs, actors and audits by tenant",()=>{
 const sql=readFileSync(join(process.cwd(),"docs/proposed-migrations/20261015_company_applicant_shares.sql"),"utf8");
 expect(sql).toContain("FOREIGN KEY (job_id,college_id)");
 expect(sql).toContain("FOREIGN KEY (created_by_membership_id,college_id)");
 expect(sql).toContain("FOREIGN KEY (share_id,college_id)");
 expect(sql).toContain("CHECK(event_kind IN ('VIEW','CSV'))");
 expect(sql).toContain("token_hash varchar(64)");
});
