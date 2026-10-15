import {it,expect} from "vitest";
import {removeFacultyMetadataDraftEntry} from "@/modules/people/faculty-profile-draft-actions";
it("deletes the selected draft field without changing unrelated metadata",()=>{
 const rows=[{id:"a",key:"Teaching"},{id:"b",key:"Research"}];
 expect(removeFacultyMetadataDraftEntry(rows,"b")).toEqual([rows[0]]);
 expect(removeFacultyMetadataDraftEntry(rows,"missing")).toEqual(rows);
 expect(rows).toHaveLength(2);
});
