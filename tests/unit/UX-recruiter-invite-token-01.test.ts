import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

describe("UX-recruiter-invite-token-01 recruiter invitation",()=>{
 it("keeps canonical token route and all exact employer-facing actions",()=>{
  const page=read("src/app/recruiter-invite/[token]/page.tsx");
  const ui=read("src/components/tpo/recruiter-invite-landing.tsx");
  expect(page).toContain("<RecruiterInviteLanding token={token}");
  for(const copy of ["Send me a code","Send a new code","Stop contacting me","Not hiring from this college this season","This link is no longer valid","This proves the email is yours."]){
   expect(ui).toContain(copy);
  }
  expect(ui).toContain('"/api/public/recruiter-invite/"+encodeURIComponent(token)');
  expect(ui).toContain('method:"POST"');
  expect(ui).toContain('pattern="[0-9]{6}"');
 });
 it("renders shared phone-first Card, Input, Skeleton and Button plus focusable friendly errors",()=>{
  const ui=read("src/components/tpo/recruiter-invite-landing.tsx");
  for(const code of ['<Card as="section"','<Skeleton variant="form"','<Input ','<Button ','<InlineNotice tone="error" message={"⚠ "+actionError}','min-h-dvh','ref={errorRef}','busyRef.current=true','busyRef.current=false']){
   expect(ui).toContain(code);
  }
  expect(ui).toContain('controller.abort()');
  expect(ui).toContain('state === "load_error"');
 });
 it("keeps a bounded route skeleton and home-safe failure route",()=>{
  expect(read("src/app/recruiter-invite/[token]/loading.tsx")).toContain('<PublicPageLoading label="Loading recruiter invitation..."');
  expect(read("src/app/recruiter-invite/[token]/error.tsx")).toContain('homeHref="/"');
 });
});