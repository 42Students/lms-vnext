import type {LearnerOfferView} from "./learner-offers-browse-model";
import type {LearnerOfferSort} from "./learner-offers-sort-model";
import type {LearnerJoiningFilter} from "./learner-offer-joining-filter-model";
import type {LearnerOfferExpiryFilter} from "./learner-offer-expiry-filter-model";
export function learnerOfferStatusHref(status:LearnerOfferView,options:{
 searchTerm:string;dueOnly:boolean;sort:LearnerOfferSort;kind?:"all"|"offer"|"loi";joining?:LearnerJoiningFilter;expiry?:LearnerOfferExpiryFilter
}):string{
 const query=new URLSearchParams();
 if(status!=="all")query.set("status",status);
 if(options.searchTerm)query.set("q",options.searchTerm);
 if(options.dueOnly)query.set("due","1");
 if(options.sort!=="priority")query.set("sort",options.sort);
 if(options.kind&&options.kind!=="all")query.set("kind",options.kind);
 if(options.joining&&options.joining!=="all")query.set("joining",options.joining);
 if(options.expiry&&options.expiry!=="all")query.set("expiry",options.expiry);
 const tail=query.toString();
 return "/learn/my-placements/offers"+(tail?"?"+tail:"");
}

/** Status tabs and optional search/sort/kind/joining facets are independent. */
export function learnerOfferHasActiveFacets(options:{
 searchTerm:string;dueOnly:boolean;sort:LearnerOfferSort;kind?:string;joining?:string;expiry?:string
}):boolean{
 return Boolean(options.searchTerm.trim())||options.dueOnly||options.sort!=="priority"||
  (options.kind!==undefined&&options.kind!=="all")||
  (options.joining!==undefined&&options.joining!=="all")||
  (options.expiry!==undefined&&options.expiry!=="all");
}
export function learnerOfferClearFiltersHref(view:LearnerOfferView):string{
 return learnerOfferStatusHref(view,{searchTerm:"",dueOnly:false,sort:"priority",kind:"all",joining:"all"});
}
