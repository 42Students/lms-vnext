import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

const root=process.cwd();
const ledger=JSON.parse(readFileSync(join(root,"docs/planning/db07-w03-field-review.json"),"utf8")) as {
  rows:Array<{legacyTable:string;legacyColumn:string;semanticStatus:string}>;
};
const schema=readFileSync(join(root,"src/db/schema/project-audit-staged.ts"),"utf8");
const sql=readFileSync(join(root,"docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql"),"utf8");

describe("W03 DB07 staged schema/source-contract (NOT SQL replay)",()=>{
  it("retains every legacy source field in the auditable W03 ledger",()=>{
    expect(ledger.rows).toHaveLength(358);
    expect(new Set(ledger.rows.map(r=>r.legacyTable)).size).toBe(16);
    expect(ledger.rows.filter(r=>r.semanticStatus==="UNVERIFIED")).toHaveLength(358);
  });
  it("stages exactly the four previously unmatched project history/comment tables",()=>{
    for(const table of ["project_delivery_events","project_meeting_history",
      "project_resource_audit","project_task_comments"]){
      expect(sql).toContain("CREATE TABLE "+table+"(");
      expect(schema).toContain('pgTable("'+table+'"');
    }
  });
  it("keeps each staged child constrained to the same project as its parent",()=>{
    for(const name of ["project_meeting_history_project_fk","project_resource_audit_project_fk",
      "project_delivery_events_project_fk","project_task_comments_project_fk"]){
      expect(schema).toContain('name:"'+name+'"');
      expect(sql).toContain("CONSTRAINT "+name);
    }
  });
  it("never alters W01's migration journal from this staged source",()=>{
    expect(sql).toContain("NOT registered in drizzle/meta/_journal.json");
    expect(sql).toContain("W01 must allocate migration number");
  });
  it("proposes immutable meeting, resource and delivery audit histories",()=>{
    for(const trg of ["w03_meeting_history_immutable","w03_resource_history_immutable",
      "w03_delivery_history_immutable"]){expect(sql).toContain("CREATE TRIGGER "+trg);}
  });
});
