import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

describe("five Doing UX groups preserve useful context during recovery",()=>{
  it("G037 returns from application failure to the selected drive when its id is valid",()=>{
    const source=read("src/app/(authenticated)/college/placements/jobs/[jobId]/applications/error.tsx");
    expect(source).toContain("useParams<{ jobId?: string }>()");
    expect(source).toContain("/college/placements/jobs/${encodeURIComponent(jobId)}/overview");
    expect(source).toContain("/college/placements/jobs");
    expect(source).toContain("Retry applications");
  });

  it("G040 preserves a valid selected template across a failed template-list retry",()=>{
    const source=read("src/app/(authenticated)/college/projects/create/page.tsx");
    expect(source).toContain("zUuid.safeParse(query.templateId).success");
    expect(source).toContain("&retry=1\"+retryTemplateId");
  });

  it("G061 keeps retry usable as a touch target on narrow screens",()=>{
    const source=read("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/error.tsx");
    expect(source).toContain('onClick={reset} className="min-h-11 md:min-h-9"');
    expect(source).toContain("Back to courses");
  });

  it("G099 identifies batch classes and returns to that batch when possible",()=>{
    const source=read("src/app/(authenticated)/tpo/batches/[batchId]/classes/error.tsx");
    expect(source).toContain('<PageHeader title="Batch classes"');
    expect(source).toContain("/tpo/batches/${encodeURIComponent(batchId)}");
    expect(source).toContain('homeHref={batchHref}');
  });

  it("G104 renders clean accessible message recovery copy and touch-sized retry",()=>{
    const source=read("src/app/(authenticated)/tpo/messages/error.tsx");
    expect(source).toContain('<PageHeader title="Messages"');
    expect(source).toContain('title="Couldn\'t load messages"');
    expect(source).not.toContain("\\n        Couldn't load Messages");
    expect(source).toContain('className="min-h-11 md:min-h-9">Retry messages</Button>');
  });
});
