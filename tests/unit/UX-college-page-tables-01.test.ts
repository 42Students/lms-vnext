import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(name:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+name+"/page.tsx"),"utf8");
describe("UX-college-page-tables-01 mobile action parity",()=>{
  it("/college/activity preserves accessible event details and scoped empty/partial state",()=>{
    const s=read("activity");
    expect(s).toContain("listCollegeActivity(context, parsed.data)");
    // The legacy activity log is a grouped timeline, not an editable roster.
    expect(s).toContain('aria-label="College activity events"');
    expect(s).toContain('group.latest');
    expect(s).toContain('href={"/college/activity/"+encodeURIComponent(item.event.id)}');
    expect(s).toContain("sanitizeActivityMetadata(item.event.metadata)");
    expect(s).toContain("Nothing important happened in this period.");
    expect(s).toContain('Alert tone="error" title="Couldn\'t load activity"');
    expect(s).toContain('href={collegeActivityHref(parsed.data)}');
    expect(s).not.toContain("<table");
  });
  it("/college/batch-promotion preserves read-only learner blockers and transaction confirmation",()=>{
    const s=read("batch-promotion");
    expect(s).toContain("previewCollegeBatchPromotion");
    expect(s).toContain('<DataTable rows={preview.learners} getRowKey={learner=>learner.membershipId}');
    expect(s).toContain("learner.blockers.join");
    expect(s).toContain("No persisted learner enrollments exist for this batch.");
    expect(s).toContain("<CollegePromotionConfirmation");
    expect(s).toContain("Preview never writes");
    expect(s).not.toContain("<table");
  });
});
