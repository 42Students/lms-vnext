import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const files=["src/components/admin/college-logo-uploader.tsx","src/components/admin/college-signin-method-form.tsx","src/components/admin/admin-revoke-sessions.tsx"];
describe("UX-admin cross-audit BLOCKER native confirmations",()=>{
 for(const path of files)it(path,()=>{
  const source=readFileSync(path,"utf8");
  expect(source).toContain("<ConfirmDialog");
  expect(source).not.toContain("window.confirm");
  expect(source).toContain("pending={");
  expect(source).toContain("onConfirm=");
 });
 it("only invokes session revocation on explicit dialog confirmation",()=>{
  const source=readFileSync(files[2],"utf8");
  expect(source).toContain('onClick={()=>{setMessage("");setErrorMessage("");setConfirmOpen(true);}}');
  expect(source).toContain("onConfirm={()=>void revoke()}");
 });
});
