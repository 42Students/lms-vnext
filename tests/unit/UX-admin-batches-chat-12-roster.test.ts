import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const s=readFileSync("src/components/admin/super-admin-batch-roster-manager.tsx","utf8");
describe("UX-admin-batches-chat-12-roster",()=>{
 it("exposes every field and Move action in one mobile DataTable",()=>{expect(s).toContain("<DataTable");expect(s).toContain("mobilePriority:\"action\"");expect(s).toContain("No matching students.");expect(s).not.toContain("<table");});
 it("guards class changes by pending-safe ConfirmDialog and old capacity checks",()=>{expect(s).not.toContain("if(!confirm(");expect(s).toContain("<ConfirmDialog");expect(s).toContain("target.capacity");expect(s).toContain("onConfirm={()=>{if(pendingRow)void assign(pendingRow);}}");});
});
