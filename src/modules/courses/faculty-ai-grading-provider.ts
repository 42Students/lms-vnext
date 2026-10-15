import type {AiGradingRubric} from "./faculty-ai-grading-model";
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
 return provider.suggest(input);
}
