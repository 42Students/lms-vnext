import {it,expect,vi} from "vitest";
import {requestAiGradingSuggestion} from "@/modules/courses/faculty-ai-grading-provider";
it("runs injected test providers only with valid bounded text and matching rubric",async()=>{
 const suggest=vi.fn(async()=>({testOnly:true}));
 const provider={id:"unit-test-only",enabled:true,suggest};
 const rubric={title:"Scoring",criteria:[{id:"a",title:"Answer",description:"Proof",maxPoints:5}]};
 await expect(requestAiGradingSuggestion(provider,{text:"A real learner answer",rubric,maxPoints:5})).resolves.toEqual({testOnly:true});
 expect(suggest).toHaveBeenCalledTimes(1);
 await expect(requestAiGradingSuggestion(provider,{text:"",rubric,maxPoints:5})).rejects.toThrow();
 await expect(requestAiGradingSuggestion(provider,{text:"Response",rubric,maxPoints:6})).rejects.toThrow();
 expect(suggest).toHaveBeenCalledTimes(1);
});
