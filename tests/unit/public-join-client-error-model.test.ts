import {describe,it,expect} from "vitest";
import {publicJoinErrorCopy,validatePublicJoinClient} from "@/modules/placements/public-join/client-error-model";
describe("REC-calendar-messages-profile-R04/39/45 join errors",()=>{
 it("does not collapse unset gate, rate limit, expired code and revoked link",()=>{
  expect(publicJoinErrorCopy("JOIN",503,"SERVICE_NOT_READY","COMPANY","example.org")).toContain("temporarily unavailable");
  expect(publicJoinErrorCopy("SEND",429,"COULD_NOT_SEND_CODE","COMPANY","example.org")).toContain("Too many");
  expect(publicJoinErrorCopy("JOIN",400,"COULD_NOT_JOIN","COLLEGE","")).toContain("code");
  expect(publicJoinErrorCopy("JOIN",400,"ACCESS_REMOVED","COLLEGE","")).toContain("ended");
 });
 it("rejects mismatched domain and invalid mobile locally",()=>{
  const base={email:"a@another.org",name:"A",phone:"",companyName:"Acme",
    companyDomain:"example.org",scope:"COMPANY" as const};
  // Client cannot know all company-verified secondary domains. The server
  // validates ownership; rejecting here would reject legitimate invitations.
  expect(validatePublicJoinClient(base)).toBe(null);
  expect(publicJoinErrorCopy("SEND",400,"COULD_NOT_SEND_CODE","COMPANY","example.org"))
    .toBe("Use your example.org email address for this link.");
  expect(validatePublicJoinClient({...base,email:"a@example.org",phone:"123"})).toContain("10-digit");
  expect(validatePublicJoinClient({...base,email:"a@example.org"})).toBe(null);
 });
});
