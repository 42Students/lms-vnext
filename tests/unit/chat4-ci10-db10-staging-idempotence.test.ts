import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("CI10 DB10 fully migrated staging overlays",()=>{
 for(const filename of ["db10-log-alerts-staging.sql","db10-skills-catalog-staging.sql"]){
  it(filename+" does not recreate existing registered tables or indexes",()=>{
   const sql=readFileSync("scripts/sql/"+filename,"utf8");
   const statements=[...sql.matchAll(/^CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX)\s+([^\n]+)/gm)];
   expect(statements.length).toBeGreaterThanOrEqual(5);
   for(const statement of statements){
    expect(statement[1]?.trimStart()).toMatch(/^IF NOT EXISTS\b/);
   }
   expect(sql).not.toMatch(/^DROP\s+(?:TABLE|INDEX)\s+/gm);
  });
 }
});
