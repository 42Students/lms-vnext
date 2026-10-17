/** Exact legacy labels from reportsMeta.js (prod-2026). */
export const TPO_LEGACY_REPORT_COPY:Record<string,{title:string;description:string}>={
 "/tpo/reports/placement-summary":{
  title:"Placement summary",description:"Every offer by where it stands (selected, released, accepted, declined...), with the students behind them",
 },
 "/tpo/reports/by-branch":{
  title:"By branch",description:"For each branch: students looking for a job, placed, the placement rate, offers and packages",
 },
 "/tpo/reports/by-company":{
  title:"By company",description:"For each company: drives that ran, students who applied, students placed, offers and packages",
 },
 "/tpo/reports/ctc":{
  title:"Packages",description:"Highest, median and average of each student's best offer, and how packages are spread. Internships are left out.",
 },
 "/tpo/reports/unplaced":{
  title:"Unplaced students",description:"Students looking for a job with no offer that counts as placed: their marks, resume, applications and whether they are still in a drive",
 },
 "/tpo/reports/offers-acceptance":{
  title:"Offers and acceptance",description:"For each company: released, waiting, accepted, declined, expired and withdrawn, and the acceptance rate",
 },
 "/tpo/reports/joining-status":{
  title:"Joining status",description:"For each company: of the students who accepted, who joined, deferred or did not join",
 },
 "/tpo/reports/failure-reasons":{
  title:"Why students did not get through",description:"Not cleared and no-shows, by company, round, branch and reason",
 },
 "/tpo/reports/leads":{
  title:"Recruiter engagement",description:"For each company: contacts, invited, joined, drives that ran and students placed (the same numbers as Engage)",
 },
 "/tpo/reports/after-college":{
  title:"After college",description:"Every student of a batch with what they do after college (placed, higher studies, entrepreneurship, competitive exams...) and the count for each, as NAAC 5.2 and NIRF ask for it",
 },
 "/tpo/reports/accreditation":{
  title:"Accreditation export",description:"One row per placed student of a batch (best offer): programme, employer and contact, package, joining. A completeness check runs before the download",
 },
};
export const TPO_LEGACY_REPORT_GALLERY_DESCRIPTION=
 "Answer placement questions quickly, then drill in and export the underlying data.";
export function legacyTpoReportCard<T extends {title:string;description:string;path:string}>(card:T):T{
 const legacy=TPO_LEGACY_REPORT_COPY[card.path];
 return legacy?{...card,title:legacy.title,description:legacy.description}:card;
}
