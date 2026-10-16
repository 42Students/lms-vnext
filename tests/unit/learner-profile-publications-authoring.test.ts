import {describe,it,expect} from "vitest";
import {learnerProfilePublicationsAwards,newLearnerPublicationEntry} from "@/modules/people/learner-profile-publications-awards-model";
describe("LEARNER-profile-misc-05 saved publication and award authoring",()=>{
 it("starts a publication as an editable profile metadata row",()=>{
  const row=newLearnerPublicationEntry("id");
  expect(row).toEqual({id:"id",key:"Publication",type:"long_text",value:""});
 });
 it("only projects true publication-labelled metadata, not unrelated remarks",()=>{
  const result=learnerProfilePublicationsAwards({
   achievements:[{id:"award",title:"Research prize",year:"2025",description:""}],
   metadata:[{id:"pub",key:"Publication",type:"long_text",value:"Conference paper"},
     {id:"note",key:"Address",type:"text",value:"private"}],
  });
  expect(result.achievements[0]?.title).toBe("Research prize");
  expect(result.publications).toEqual([{id:"pub",value:"Conference paper"}]);
 });
});
