import {it,expect} from "vitest";
import {facultyProfileErrorCode} from "@/modules/people/faculty-profile-error-model";
it("accepts only safe coded errors from JSON envelopes",()=>{
 expect(facultyProfileErrorCode({error:"FACULTY_PROFILE_VERSION_CONFLICT"})).toBe("FACULTY_PROFILE_VERSION_CONFLICT");
 for(const raw of [null,[],{error:{secret:"s"}},{error:"secret password"},{error:"x".repeat(129)}])
  expect(facultyProfileErrorCode(raw)).toBeUndefined();
});
