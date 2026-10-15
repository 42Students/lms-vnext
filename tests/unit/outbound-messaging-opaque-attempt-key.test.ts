import {expect,it} from "vitest";
import {opaqueBatchAttemptKey} from "@/modules/messaging/batch-dedupe";
it("uses an unambiguous channel/recipient/purpose/template tuple",()=>{
 const a=opaqueBatchAttemptKey("EMAIL","ab","c","d");
 const b=opaqueBatchAttemptKey("EMAIL","a","bc","d");
 expect(a).not.toBe(b);
 expect(a).toBe(opaqueBatchAttemptKey("EMAIL","ab","c","d"));
 expect(a).not.toBe(opaqueBatchAttemptKey("EMAIL","ab","c","different-template"));
});
