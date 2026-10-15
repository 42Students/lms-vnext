import {expect,it} from "vitest";
import {facultyContentDraftChanged} from "@/modules/courses/faculty-content-edit-model";
it("disables no-op edit saves but sees every content field change",()=>{
 const base={title:"Lesson",notes:"N",url:"https://example.com",duration:"300",starts:"",ends:""};
 expect(facultyContentDraftChanged(base,{...base})).toBe(false);
 for (const [key,value] of Object.entries({title:"Other",notes:"Notes",url:"https://other.test",duration:"60",starts:"2026-10-15T10:00",ends:"2026-10-15T11:00"})){
  expect(facultyContentDraftChanged(base,{...base,[key]:value})).toBe(true);
 }
});
