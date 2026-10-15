import type {LearnerOfferView} from "./learner-offers-browse-model";
import type {LearnerOfferSort} from "./learner-offers-sort-model";
import type {LearnerJoiningFilter} from "./learner-offer-joining-filter-model";
export function learnerOfferStatusHref(status:LearnerOfferView,options:{
 searchTerm:string;dueOnly:boolean;sort:LearnerOfferSort;kind?:"all"|"offer"|"loi";joining?:LearnerJoiningFilter
}):string{
 const query=new URLSearchParams();
 if(status!=="all")query.set("status",status);
 if(options.searchTerm)query.set("q",options.searchTerm);
 if(options.dueOnly)query.set("due","1");
 if(options.sort!=="priority")query.set("sort",options.sort);
 if(options.kind&&options.kind!=="all")query.set("kind",options.kind);
 if(options.joining&&options.joining!=="all")query.set("joining",options.joining);
 const tail=query.toString();
 return "/learn/my-placements/offers"+(tail?"?"+tail:"");
}
