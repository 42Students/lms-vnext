import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("TPO-home-R08 loads independent Home signals concurrently and fails each heavy source independently",()=>{
 const page=readFileSync("src/app/(authenticated)/tpo/home/page.tsx","utf8");
 expect(page).toContain("=await Promise.all([");
 expect(page).toContain("listTpoBatches(ctx).catch(()=>null)");
 expect(page).toContain("getPlacementTpoOperations(ctx,collegeId).catch(()=>null)");
 expect(page).toContain("if(!batchResult?.ready||!operationsResult){");
 expect(page).toContain('title="Could not load Home"');
 expect(page).toContain("const batches=batchResult;");
 expect(page).toContain("const operations=operationsResult;");
 expect(page).toContain("Some Home indicators could not be loaded.");
 expect(page).toContain('value:operationsResult?operations.summary.publishedJobs:"—"');
});
