import {expect,it} from "vitest";
import {facultyAssignmentDraftDirty} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("warns before publishing fields that would not be included in the publish command",()=>{
 const saved={title:"Exam",description:"Read",dueAt:"2026-10-15T04:30:00.000Z",maxPoints:10};
 const draft={title:"Exam",description:"Read",dueAt:"2026-10-15T10:00",maxPoints:10};
 expect(facultyAssignmentDraftDirty(saved,draft)).toBe(false);
 expect(facultyAssignmentDraftDirty(saved,{...draft,title:"Other"})).toBe(true);
 expect(facultyAssignmentDraftDirty(saved,{...draft,description:"Other"})).toBe(true);
 expect(facultyAssignmentDraftDirty(saved,{...draft,dueAt:"2026-10-15T11:00"})).toBe(true);
 expect(facultyAssignmentDraftDirty(saved,{...draft,maxPoints:11})).toBe(true);
});
