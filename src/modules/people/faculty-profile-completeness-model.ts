import type {FacultyProfileDocument} from "./faculty-profile-document";

/** Single source for Faculty self-reported profile completeness, independent
 * of college-managed title/employment data and private identity evidence.
 * All 13 editable sections are optional; the score is informational only. */
export function facultyProfileCompleteness(document:FacultyProfileDocument){
 const filled=[
  Boolean(document.about.description.trim()),
  Boolean(document.personalDetails.dateOfBirth || document.personalDetails.gender),
  Boolean(document.contact.contactMail || document.contact.contactMobile),
  Boolean(document.address.currentAddress || document.address.permanentAddress),
  Boolean(Object.values(document.socialProfiles).some(value=>
   Array.isArray(value)?value.some(Boolean):value && typeof value==="object"
    ?Object.values(value).some(Boolean):Boolean(value))),
  document.experiences.length>0,
  document.education.length>0,
  document.skills.length>0,
  document.certifications.length>0,
  document.languages.length>0,
  document.publications.length>0,
  document.awards.length>0,
  Object.keys(document.metadata).some(key=>document.metadata[key]!==null &&
    String(document.metadata[key]).trim().length>0),
 ];
 const completed=filled.filter(Boolean).length;
 return {completed,total:filled.length,percent:Math.round(completed/filled.length*100)};
}
