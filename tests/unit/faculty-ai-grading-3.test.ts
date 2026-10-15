import {it,expect,vi} from "vitest";
import {disabledAiGradingProvider,requestAiGradingSuggestion,AiGradingProviderDisabled} from "@/modules/courses/faculty-ai-grading-provider";
it("does not reach any model or network when the provider is disabled",async()=>{
 const suggest=vi.fn();const input={text:"Submitted work",rubric:{title:"Rubric",criteria:[{id:"a",title:"Area",description:"Evidence",maxPoints:10}]},maxPoints:10};
 await expect(requestAiGradingSuggestion({...disabledAiGradingProvider,suggest},input)).rejects.toBeInstanceOf(AiGradingProviderDisabled);
 expect(suggest).not.toHaveBeenCalled();
});
