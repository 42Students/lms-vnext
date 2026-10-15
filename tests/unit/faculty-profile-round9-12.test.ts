import {it,expect} from "vitest";
import {facultyMetadataDraftIssue} from "@/modules/people/faculty-profile-draft-actions";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("uses existing protected metadata validation before submission",()=>{
 expect(facultyMetadataDraftIssue({active:true},[{id,key:"teaching",value:"Systems"}])).toBeNull();
 expect(facultyMetadataDraftIssue({},[{id,key:"tokenPrivate",value:"x"}])).toMatch(/permitted/);
 expect(facultyMetadataDraftIssue({},[{id,key:"foo",value:"a"},{id:"7dc6c0f9-447d-4e46-9e8d-14b20210a217",key:"foo",value:"b"}])).toMatch(/Duplicate/);
 expect(facultyMetadataDraftIssue({},[{id,key:"",value:"x"}])).not.toBeNull();
});
