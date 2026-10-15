import type {LearnerOfferView} from "./learner-offers-browse-model";
import type {LearnerOfferSort} from "./learner-offers-sort-model";
export function learnerOfferStatusHref(status:LearnerOfferView,options:{
 searchTerm:string;dueOnly:boolean;sort:LearnerOfferSort
}):string{
 const query=new URLSearchParams();
 if(status!=="all")query.set("status",status);
 if(options.searchTerm)query.set("q",options.searchTerm);
 if(options.dueOnly)query.set("due","1");
 if(options.sort!=="priority")query.set("sort",options.sort);
 const tail=query.toString();
 return "/learn/my-placements/offers"+(tail?"?"+tail:"");
}
