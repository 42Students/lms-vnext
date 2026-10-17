import {describe,it,expect} from "vitest";
import {learnerDrivePageState} from "@/modules/placements/learner-drive-pagination-model";
import {readFileSync} from "node:fs";
it("LEARNER-placements-19 NOT-A-GAP matches legacy 20 jobs per page and recoverable page number",()=>{
 expect(learnerDrivePageState(41,1)).toMatchObject({startIndex:0,endIndex:20,totalPages:3});
 expect(learnerDrivePageState(41,3)).toMatchObject({startIndex:40,endIndex:41,totalPages:3});
 expect(learnerDrivePageState(41,100)).toMatchObject({page:3,recovered:true});
 expect(readFileSync("src/components/placements/learner-jobs-browse.tsx","utf8")).toContain("const PAGE_SIZE = 20;");
});