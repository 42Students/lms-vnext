import {it,expect} from "vitest";
import {assertAiGradingProviderProvenance} from "@/modules/courses/faculty-ai-grading-suggestion";
it("rejects fabricated provider attribution in scored suggestions",()=>{
 expect(()=>assertAiGradingProviderProvenance("approved-test","approved-test")).not.toThrow();
 expect(()=>assertAiGradingProviderProvenance("other-provider","approved-test")).toThrow("AI_GRADING_PROVIDER_MISMATCH");
});
