import {expect,it} from "vitest";
import {facultyFollowupEmptyState,facultyResponseFollowUpQuerySchema} from "@/modules/courses/faculty-response-followup-model";
it("explains distinct unassigned, filtered and overdue-empty states",()=>{
 const all=facultyResponseFollowUpQuerySchema.parse({});
 expect(facultyFollowupEmptyState(all,0)).toMatchObject({title:"No current teaching Sections",clearFilters:false});
 expect(facultyFollowupEmptyState(all,1)).toMatchObject({title:"No past-due assessments to review",clearFilters:false});
 expect(facultyFollowupEmptyState({...all,kind:"QUIZ"},1)).toMatchObject({title:"No follow-ups match these filters",clearFilters:true});
});
