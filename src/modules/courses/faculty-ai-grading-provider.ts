import {z} from "zod";
import {aiGradingRubricSchema,aiGradingRubricForMaximum,type AiGradingRubric} from "./faculty-ai-grading-model";
export const aiGradingProviderInputSchema=z.object({
 text:z.string().min(1).max(50000).refine(value=>Boolean(value.trim())),
 rubric:aiGradingRubricSchema,maxPoints:z.number().int().min(1).max(10000),
}).strict();
export type AiGradingProviderInput={
 text:string;rubric:AiGradingRubric;maxPoints:number;
};
export type AiGradingProvider={
 readonly id:string;readonly enabled:boolean;
 suggest(input:AiGradingProviderInput):Promise<unknown>;
};
export class AiGradingProviderDisabled extends Error{
 constructor(){super("AI_PROVIDER_DISABLED");}
}
/** No network client, credentials, or model dependency is instantiated by default. */
export const disabledAiGradingProvider:AiGradingProvider={
 id:"disabled",enabled:false,
 async suggest(){throw new AiGradingProviderDisabled();}
};
export async function requestAiGradingSuggestion(provider:AiGradingProvider,input:AiGradingProviderInput){
 if(!provider.enabled)throw new AiGradingProviderDisabled();
 const checked=aiGradingProviderInputSchema.parse(input);
 aiGradingRubricForMaximum(checked.rubric,checked.maxPoints);
 return provider.suggest(checked);
}
