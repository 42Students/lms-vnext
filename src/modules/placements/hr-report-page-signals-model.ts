import type {RecruiterReportRow} from "./recruiter-company-reports-model";
export function hrCompanyReportPageSignals(rows:readonly RecruiterReportRow[]){
 const sum=(key:keyof Pick<RecruiterReportRow,
  "applications"|"submittedApplications"|"withdrawnApplications"|"outstandingOffers"|
  "acceptedOffers"|"declinedOffers"|"joinedOffers">)=>rows.reduce((total,row)=>total+row[key],0);
 return {drives:rows.length,applications:sum("applications"),
  submitted:sum("submittedApplications"),withdrawn:sum("withdrawnApplications"),
  outstanding:sum("outstandingOffers"),accepted:sum("acceptedOffers"),
  declined:sum("declinedOffers"),joined:sum("joinedOffers")};
}
