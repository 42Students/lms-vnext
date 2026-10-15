import {it,expect} from "vitest";
import {facultyMoveSkillRecord} from "@/modules/people/faculty-profile-draft-actions";
it("reorders skills immutably and ignores out-of-bounds commands",()=>{
 const rows=[{id:"a"},{id:"b"},{id:"c"}];
 expect(facultyMoveSkillRecord(rows,"c",0).map(x=>x.id)).toEqual(["c","a","b"]);
 expect(facultyMoveSkillRecord(rows,"a",99)).toEqual(rows);
 expect(rows.map(x=>x.id)).toEqual(["a","b","c"]);
});
