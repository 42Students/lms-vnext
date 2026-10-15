import {verificationQueueFilters} from "./queue-filters";
export function parseCollegeVerificationPageQuery(raw:Record<string,string|string[]|undefined>){
 const query:Record<string,string>={};
 for(const [key,value] of Object.entries(raw)){
  if(Array.isArray(value))return {success:false as const};
  if(value!==undefined&&value!=="")query[key]=value;
 }
 const parsed=verificationQueueFilters.safeParse(query);
 if(!parsed.success)return {success:false as const};
 return {success:true as const,data:parsed.data};
}
