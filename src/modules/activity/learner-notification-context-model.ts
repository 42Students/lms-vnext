/** LEARNER-profile-misc-21: labels are grounded in the producer audience,
 * never guessed from notification body or URL. */
export function learnerAnnouncementAudienceContext(receiverType:string){
 switch(receiverType.toUpperCase()){
  case "CLASS":case "SECTION":return "Class";
  case "DEPARTMENT":return "Department";
  case "PROGRAM":return "Program";
  case "STUDENT":case "LEARNER":return "Student";
  case "COLLEGE":case "ALL":return "College-wide";
  default:return "Announcement audience";
 }
}
