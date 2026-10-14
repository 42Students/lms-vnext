import {describe,expect,it} from "vitest";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {learnerProfilePublicationsAwards} from "@/modules/people/learner-profile-publications-awards-model";
const first="81818181-8181-4818-8818-818181818181";
const second="92929292-9292-4929-8929-929292929292";
describe("learner-authored publications and awards read view",()=>{
 it("labels only explicitly authored metadata as publications; achievements remain unverified",()=>{
  const doc=learnerProfileDocumentSchema.parse({
   achievements:[{id:first,title:"Merit recognition",year:"2025",description:"Student entry"}],
   metadata:[{id:second,key:"Publication",type:"text",value:"Journal paper (self reported)"}]
  });
  expect(learnerProfilePublicationsAwards(doc)).toEqual({
    achievements:[{id:first,title:"Merit recognition",year:"2025"}],
    publications:[{id:second,value:"Journal paper (self reported)"}]
  });
 });
 it("does not infer publication from unrelated research descriptions",()=>{
  const doc=learnerProfileDocumentSchema.parse({
   metadata:[{id:first,key:"Research interests",type:"text",value:"Published research maybe"}]
  });
  expect(learnerProfilePublicationsAwards(doc).publications).toEqual([]);
 });
});
