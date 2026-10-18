import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {isConfirmedRecruiterLeaveResponse} from "@/modules/placements/recruiter-profile-access-model";
const grant="11111111-1111-4111-8111-111111111111",other="22222222-2222-4222-8222-222222222222";
describe("HR-BREAK-LEAVE-GRANT-43 safely revoke own college access",()=>{
 it("confirms only an exact matching persisted revoked grant",()=>{
  expect(isConfirmedRecruiterLeaveResponse({access:{grantId:grant,status:"REVOKED"}},grant)).toBe(true);
 });
 it.each([
  null,undefined,true,[],{},'<html>Sign in</html>',
  {access:{grantId:grant,status:"ACTIVE"}},
  {access:{grantId:other,status:"REVOKED"}},
  {access:{grantId:grant,status:"CANCELLED"}},
  {access:{status:"REVOKED"}},
  {access:null},
 ])("never claims access was removed without the exact server receipt %j",raw=>{
  expect(isConfirmedRecruiterLeaveResponse(raw,grant)).toBe(false);
 });
 it("opens an accessible consequence dialog instead of browser confirm and guards double DELETE",()=>{
  const source=readFileSync("src/components/hr/recruiter-profile-access.tsx","utf8");
  expect(source).toContain('<ConfirmActionDialog open={confirmGrant!==null}');
  expect(source).toContain('title={"Leave access to "+(confirmGrant?.collegeName??"this college")+"?"}');
  expect(source).toContain('if(leavingRef.current)return');
  expect(source).toContain('redirect:"error"');
  expect(source).toContain('isConfirmedRecruiterLeaveResponse(payload,grant.id)');
  expect(source).not.toContain("window.confirm(");
  expect(source).toContain("min-h-11");
 });
 it("does not redirect or drop college choices when DELETE response cannot be verified",()=>{
  const source=readFileSync("src/components/hr/recruiter-profile-access.tsx","utf8");
  const verifyAt=source.indexOf("if(!isConfirmedRecruiterLeaveResponse(payload,grant.id))");
  const removeAt=source.indexOf("setItems(current=>current.filter");
  const navigateAt=source.indexOf('window.location.assign("/hr/home")');
  expect(verifyAt).toBeGreaterThan(0);
  expect(removeAt).toBeGreaterThan(verifyAt);
  expect(navigateAt).toBeGreaterThan(removeAt);
  expect(source).toContain("Could not confirm that your college access was removed.");
 });
});
