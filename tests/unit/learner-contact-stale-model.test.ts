import {describe,expect,it} from "vitest";
import {learnerContactEditSchema,learnerContactsAreStale}
from "@/modules/people/learner-contact-model";
describe("learner contact optimistic update and privacy",()=>{
  const current={alternatePhone:"",contactEmail:"private@example.test"};
  it("rejects an outdated copy without accepting caller-selected identity",()=>{
    expect(learnerContactsAreStale(current,{alternatePhone:"",contactEmail:"old@example.test"})).toBe(true);
    expect(learnerContactsAreStale(current,current)).toBe(false);
    const parsed=learnerContactEditSchema.parse({confirmed:true,
      contacts:current,expectedContacts:current});
    expect(parsed.expectedContacts).toEqual(current);
    expect(()=>learnerContactEditSchema.parse({confirmed:true,
      contacts:current,expectedContacts:current,userId:"foreign"})).toThrow();
  });
});