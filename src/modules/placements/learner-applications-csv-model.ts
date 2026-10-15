import type {LearnerApplicationBrowseItem} from "./learner-applications-browse-model";
function escapeCsv(value:string){
 const safe=/^[\s\uFEFF]*[=+@-]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
/** Only already-authorized and currently selected application fields.
 * No personal contact, employer-only notes, documents or screening feedback. */
export function learnerApplicationsCsv(rows:readonly LearnerApplicationBrowseItem[]):string{
 const header=["Employer","Position","Application status","Screening stage","Applied at (UTC)","Withdrawn at (UTC)"];
 const values=rows.map(row=>[
  row.companyName,row.jobTitle,row.applicationStatus,row.screening.status,
  row.submittedAt.toISOString(),row.withdrawnAt?.toISOString()??"",
 ]);
 return "\uFEFF"+[header,...values].map(cells=>cells.map(escapeCsv).join(",")).join("\r\n")+"\r\n";
}
