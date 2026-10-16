import type {TpoRecruiterLeadStage} from "./tpo-recruiter-lead-policy";
export function recruiterBoardColumn<T extends {stage:TpoRecruiterLeadStage}>(
 rows:readonly T[],stage:TpoRecruiterLeadStage){
 const found=rows.filter(x=>x.stage===stage);
 return {total:found.length,visible:found.slice(0,stage==="RECRUITED"||stage==="NOT_NOW"?5:50)};
}
export function shouldRenderCompaniesView(view:"table"|"board"|"companies",visibleLeadCount:number){
 return view==="companies"||visibleLeadCount>0;
}
