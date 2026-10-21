/** A failed roster read compromises report integrity. Learners who simply
 * have not submitted or been graded are normal in-progress rows, not a broken
 * PDF snapshot: show their pending statuses without an integrity warning. */
export type FacultyReportPopulation =
 | {kind:"quiz";eligibleLearners:number;submittedLearners:number;questionCount:number;rosterReadFailed?:boolean}
 | {kind:"assignment";eligibleLearners:number;submitted:number;graded:number;rosterReadFailed?:boolean};

export function facultyReportCompleteness(input:FacultyReportPopulation){
 const counts=input.kind==="quiz"
  ?[input.eligibleLearners,input.submittedLearners,input.questionCount]
  :[input.eligibleLearners,input.submitted,input.graded];
 const invalid=counts.some(n=>!Number.isSafeInteger(n)||n<0) ||
  input.kind==="quiz"&&input.questionCount===0 ||
  input.kind==="quiz"&&input.submittedLearners>input.eligibleLearners ||
  input.kind==="assignment"&&(input.submitted>input.eligibleLearners||input.graded>input.submitted);
 const integrityIncomplete=Boolean(input.rosterReadFailed)||invalid;
 const inProgress=!integrityIncomplete&&(input.kind==="quiz"
  ? input.submittedLearners<input.eligibleLearners
  : input.submitted<input.eligibleLearners||input.graded<input.submitted);
 return {integrityIncomplete,inProgress,emptyCohort:input.eligibleLearners===0};
}
/** The existing PDF confirmation prop means a data-integrity failure only.
 * Pages should display inProgress separately, without confirmation. */
export function facultyReportIsIncomplete(input:FacultyReportPopulation):boolean{
 return facultyReportCompleteness(input).integrityIncomplete;
}
