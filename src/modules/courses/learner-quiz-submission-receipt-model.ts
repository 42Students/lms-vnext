/** A successful response belongs only to the exact submitted quiz, not a later navigation. */
export function learnerQuizSubmissionReceiptVisible(confirmedQuizId:string|null,viewingQuizId:string):boolean {
  return Boolean(confirmedQuizId && viewingQuizId && confirmedQuizId===viewingQuizId);
}
