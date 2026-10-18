import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const files=["src/components/academics/college-promotion-confirmation.tsx","src/components/admin/managed-college-subdomain.tsx"];
describe("UX-admin cross-audit promotion/domain confirmations",()=>{
 for(const p of files)it(p,()=>{const s=readFileSync(p,"utf8");expect(s).toContain("<ConfirmDialog");expect(s).not.toContain("window.confirm");expect(s).not.toContain('role="dialog"');expect(s).toContain("pending={");});
});
