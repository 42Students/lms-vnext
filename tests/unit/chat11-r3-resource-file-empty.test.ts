import {expect,it} from "vitest";
import {resourceFileEmptyPresentation as view} from "@/modules/projects/resource-file-empty-model";
it("never claims a file-less storage dependency is a genuinely empty folder",()=>{
 expect(view({state:"UNAVAILABLE",recordCount:0,filteredCount:0})?.title).toBe("File storage unavailable");
 expect(view({state:"ERROR",recordCount:0,filteredCount:0})?.showRetry).toBe(true);
 expect(view({state:"DENIED",recordCount:0,filteredCount:0})?.showRetry).toBe(false);
});
it("distinguishes first-use from filtered-empty and populated results",()=>{
 expect(view({state:"READY",recordCount:0,filteredCount:0})?.title).toBe("No files yet");
 expect(view({state:"READY",recordCount:5,filteredCount:0})?.title).toBe("No matching files");
 expect(view({state:"READY",recordCount:5,filteredCount:2})).toBeNull();
});
