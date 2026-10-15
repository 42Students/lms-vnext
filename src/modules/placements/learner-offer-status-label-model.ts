import type {LearnerOfferView} from "./learner-offers-browse-model";
/** The persisted ISSUED status may be past deadline; this filter is history,
 * not an assertion that the offer can still be accepted. */
export function learnerOfferStatusTabLabel(view:LearnerOfferView):string{
 const labels:Record<LearnerOfferView,string>={
  all:"All offers",pending:"Issued (check deadline)",accepted:"Accepted",
  closed:"Declined / withdrawn",declined:"Declined",
  withdrawn:"Withdrawn by placement team",
 };
 return labels[view];
}
