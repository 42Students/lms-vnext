// The Reports gallery (TPO V1 - Locked.docx §8). Each line says what the report answers; reportViews says how it shows it.
export const REPORTS = {
  "placement-summary": { title: "Placement summary", help: "Every offer by where it stands (selected, released, accepted, declined...), with the students behind them" },
  "by-branch": { title: "By branch", help: "For each branch: students looking for a job, placed, the placement rate, offers and packages" },
  "by-company": { title: "By company", help: "For each company: drives that ran, students who applied, students placed, offers and packages" },
  ctc: { title: "Packages", help: "Highest, median and average of each student's best offer, and how packages are spread. Internships are left out." },
  unplaced: { title: "Unplaced students", help: "Students looking for a job with no offer that counts as placed: their marks, resume, applications and whether they are still in a drive" },
  "offers-acceptance": { title: "Offers and acceptance", help: "For each company: released, waiting, accepted, declined, expired and withdrawn, and the acceptance rate" },
  "joining-status": { title: "Joining status", help: "For each company: of the students who accepted, who joined, deferred or did not join" },
  "failure-reasons": { title: "Why students did not get through", help: "Not cleared and no-shows, by company, round, branch and reason" },
  "recruiter-leads": { title: "Recruiter engagement", help: "For each company: contacts, invited, joined, drives that ran and students placed (the same numbers as Engage)" },
  outcomes: { title: "After college", help: "Every student of a batch with what they do after college (placed, higher studies, entrepreneurship, competitive exams...) and the count for each, as NAAC 5.2 and NIRF ask for it" },
  accreditation: { title: "Accreditation export", help: "One row per placed student of a batch (best offer): programme, employer and contact, package, joining. A completeness check runs before the download" },
};
