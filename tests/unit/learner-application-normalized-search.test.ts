import {expect,it} from "vitest";
import {browseLearnerApplications,DEFAULT_LEARNER_APPLICATION_FILTERS} from "@/modules/placements/learner-applications-browse-model";
it("searches own persisted applications across case and whitespace",()=>{
 const item=(id:string,companyName:string)=>({applicationId:id,companyName,jobTitle:"Junior Engineer",applicationStatus:"SUBMITTED",submittedAt:new Date("2026-10-01T00:00:00Z"),
 withdrawnAt:null,screening:{status:"APPLIED",decidedAt:null},results:[]});
 const rows=[item("a","New   Vision"),item("b","Other")];
 expect(browseLearnerApplications(rows,{...DEFAULT_LEARNER_APPLICATION_FILTERS,search:"NEW\tVISION"}).map(x=>x.applicationId)).toEqual(["a"]);
 expect(browseLearnerApplications(rows,{...DEFAULT_LEARNER_APPLICATION_FILTERS,search:"JUNIOR   engineer"})).toHaveLength(2);
 expect(rows.map(x=>x.applicationId)).toEqual(["a","b"]);
});
