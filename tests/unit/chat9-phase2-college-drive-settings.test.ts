import {describe,expect,it} from "vitest";
import {collegeDriveCloseAction} from "@/modules/placements/college-legacy-drive-settings-model";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("college legacy drive settings safety",()=>{
  it("uses exact source labels and blocks unsupported Open and Delete semantics",()=>{
    expect(collegeDriveCloseAction("PUBLISHED")).toEqual({
      action:"CLOSE",label:"Close drive",
      confirmation:"Are you sure you want to close this drive?",
    });
    expect(collegeDriveCloseAction("DRAFT")).toBeNull();
    expect(collegeDriveCloseAction("CLOSED")).toBeNull();
    expect(collegeDriveCloseAction("ARCHIVED")).toBeNull();
  });
  it("leaves writes on same-origin protected lifecycle endpoint",()=>{
    const src=readFileSync(join(process.cwd(),
      "src/components/placements/college-legacy-drive-settings.tsx"),"utf8");
    expect(src).toContain('method:"POST"');
    expect(src).toContain('action:action.action');
    expect(src).toContain("if(!result.ok)");
    expect(src).not.toContain('method:"DELETE"');
  });
  it("requires college admin then scoped persisted job read",()=>{
    const src=readFileSync(join(process.cwd(),
      "src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx"),"utf8");
    expect(src).toContain('hasMembershipRole(context,"COLLEGE_ADMIN")');
    expect(src).toContain("getCollegeDriveOverview(context,jobId)");
  });
});
