import type {LearnerOfferView} from "./learner-offers-browse-model";
import type {LearnerOfferSort} from "./learner-offers-sort-model";
export function learnerOfferStatusHref(status:LearnerOfferView,options:{
 searchTerm:string;dueOnly:boolean;sort:LearnerOfferSort;kind?:"all"|"offer"|"loi";joining?:"all"|"joined"
}):string{
 const query=new URLSearchParams();
 if(status!=="all")query.set("status",status);
 if(options.searchTerm)query.set("q",options.searchTerm);
 if(options.dueOnly)query.set("due","1");
 if(options.sort!=="priority")query.set("sort",options.sort);
 if(options.kind&&options.kind!=="all")query.set("kind",options.kind);
 if(options.joining==="joined")query.set("joining","joined");
 const tail=query.toString();
 return "/learn/my-placements/offers"+(tail?"?"+tail:"");
}
