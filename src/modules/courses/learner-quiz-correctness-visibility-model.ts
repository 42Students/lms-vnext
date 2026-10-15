/** Both official result publication and the scoped attempt must permit correctness disclosure. */
export function canReviewLearnerQuizCorrectAnswers(resultsPublished:boolean,attemptResultsVisible:boolean):boolean {
 return resultsPublished && attemptResultsVisible;
}
