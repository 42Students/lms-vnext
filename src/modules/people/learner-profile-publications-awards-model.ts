import type {LearnerProfileDocument} from "./profile-validation";
/** Preserve authorship: achievements are not automatically certified awards. */
export function learnerProfilePublicationsAwards(
  document:Pick<LearnerProfileDocument,"achievements"|"metadata">,
){
 return {
  achievements:document.achievements.map(item=>({
    id:item.id,title:item.title,year:item.year,
  })),
  publications:document.metadata.filter(item=>
    /^(publication|publications|research publication|research publications)$/i.test(item.key.trim())&&
    item.value.trim().length>0
  ).map(item=>({id:item.id,value:item.value.trim()})),
 };
}

/** Opens the existing, persisted Additional information edit flow without
 * manufacturing a parallel publications table or claiming college verification. */
export function newLearnerPublicationEntry(id:string) {
 return {id,key:"Publication",type:"long_text" as const,value:""};
}
