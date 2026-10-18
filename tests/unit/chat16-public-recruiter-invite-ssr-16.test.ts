import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import RecruiterInvitePage from "@/app/recruiter-invite/[token]/page";

describe("chat-16 public recruiter invitation server-rendered entrypoint",()=>{
 it("UX-chat16-recruiter-invite-16 never exposes an opaque invitation token or private contact details in initial HTML",async()=>{
  const token="opaque-test-invitation-do-not-render-123456789";
  const markup=renderToStaticMarkup(await RecruiterInvitePage({
   params:Promise.resolve({token}),
  }));
  expect(markup).toContain("Loading invitation");
  expect(markup).toContain('role="status"');
  expect(markup).not.toContain(token);
  expect(markup).not.toContain("contactEmail");
  expect(markup).not.toContain("companyRelationshipId");
  expect(markup).not.toContain("Send me a code");
  expect(markup).not.toContain("You now have access");
 });
 it("UX-chat16-recruiter-invite-17 initial entry cannot auto-accept or unsubscribe without a user POST",async()=>{
  const markup=renderToStaticMarkup(await RecruiterInvitePage({
   params:Promise.resolve({token:"another-opaque-recruiter-link"}),
  }));
  expect(markup).not.toContain("Your invitation has been accepted");
  expect(markup).not.toContain("Thank you, we have told the placement cell");
  expect(markup).toContain("Loading invitation");
 });
});