import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const s=readFileSync("src/components/admin/college-bulk-import.tsx","utf8");
describe("UX-admin-colleges-chat-12-bulk-confirm",()=>{
 it("guards destructive draft discard and bulk import behind accessible confirmation",()=>{expect(s).not.toContain("window.confirm");expect(s).toContain("confirmImport");expect(s).toContain("confirmDiscard");expect(s).toContain("onConfirm={()=>void submit()}");});
 it("keeps all CSV results visible in one responsive shared table",()=>{expect(s).toContain("<DataTable");expect(s).toContain("rows={results}");expect(s).toContain('empty={<EmptyState title="No import results"');expect(s).not.toContain("<table");});
});
