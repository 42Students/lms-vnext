import {describe,expect,it} from "vitest";
import {
  learnerQuizHistoryQuerySchema,ownQuizHistorySelection,learnerAttemptResultLabel,
  learnerQuizAttemptDateLabel,learnerQuizQuestionAwardLabel,learnerQuizSelectedAnswerMessage,
} from "@/modules/courses/learner-quiz-history-model";
import {learnerQuizReviewRows} from "@/modules/courses/learner-quiz-review-model";
import {learnerQuizReviewQuestionNotice} from "@/modules/courses/learner-quiz-review-question-availability-model";
import {selectLearnerLatestQuizAttempt} from "@/modules/courses/learner-latest-quiz-attempt-model";

const quizId="11111111-1111-4111-8111-111111111111";
const deliveryId="22222222-2222-4222-8222-222222222222";
const foreignDelivery="33333333-3333-4333-8333-333333333333";
const attemptId="44444444-4444-4444-8444-444444444444";
const authorized=[{id:quizId,deliveryId,title:"Quiz 1"}];

describe("COURSES-LEARNER-QUIZ-HISTORY-01 authorized learner history and score integrity",()=>{
  it("requires an exact authorized delivery and rejects foreign quiz/tenant or smuggled fields",()=>{
    expect(ownQuizHistorySelection(authorized,{quizId,deliveryId})).toEqual({
      quiz:authorized[0],attemptId:null,
    });
    expect(ownQuizHistorySelection(authorized,{quizId,deliveryId,attemptId})).toEqual({
      quiz:authorized[0],attemptId,
    });
    for(const invalid of [
      {quizId,deliveryId:foreignDelivery},
      {quizId:foreignDelivery,deliveryId},
      {quizId:"no",deliveryId},
      {quizId,deliveryId,attemptId:"bad"},
      {quizId,deliveryId,collegeId:foreignDelivery},
      {quizId,deliveryId,learnerId:foreignDelivery},
      null,
    ]){
      expect(learnerQuizHistoryQuerySchema.safeParse(invalid).success &&
        ownQuizHistorySelection(authorized,invalid)!==null).toBe(false);
    }
    expect(authorized).toHaveLength(1);
  });
  it("never reports unpublished or invalid/non-finite grades as recorded points",()=>{
    const score={resultsVisible:true,score:8,maxScore:10};
    expect(learnerAttemptResultLabel(score)).toBe("8 / 10 points");
    expect(learnerAttemptResultLabel({...score,resultsVisible:false})).toBe("Result not published");
    for(const invalid of [
      {...score,score:null},{...score,maxScore:null},
      {...score,score:Number.NaN},{...score,score:Number.POSITIVE_INFINITY},
      {...score,maxScore:Number.NEGATIVE_INFINITY},
      {...score,score:-1},{...score,maxScore:-3},
    ])expect(learnerAttemptResultLabel(invalid)).toBe("Score unavailable");
    expect(learnerQuizQuestionAwardLabel(0,10)).toBe("Awarded 0 / 10 points");
    for(const [awarded,max] of [
      [null,10],[Number.NaN,10],[3,Number.POSITIVE_INFINITY],[-1,10],[2,-1],
    ] as const)expect(learnerQuizQuestionAwardLabel(awarded,max)).toBe("Question marks unavailable");
  });
  it("does not silently hide one of several previously selected but removed options",()=>{
    const options=[{id:"answer-1"},{id:"answer-2"}];
    expect(learnerQuizSelectedAnswerMessage([],options)).toBe("No answer recorded for this question.");
    expect(learnerQuizSelectedAnswerMessage(["answer-1"],options)).toBeNull();
    expect(learnerQuizSelectedAnswerMessage(["missing"],options))
      .toBe("Previously selected option is unavailable for review.");
    expect(learnerQuizSelectedAnswerMessage(["answer-1","missing"],options))
      .toBe("Previously selected option is unavailable for review.");
    expect(learnerQuizReviewRows([{id:"q1",options}],{
      q1:["answer-1","missing","answer-1"],
    })).toEqual([{questionId:"q1",selectedCount:1,answered:true}]);
  });
  it("uses recorded attempts, not published question availability, for the history empty state",()=>{
    expect(learnerQuizReviewQuestionNotice(0,true))
      .toContain("submitted attempt remains recorded");
    expect(learnerQuizReviewQuestionNotice(0,false))
      .toContain("cannot start an attempt");
    expect(learnerQuizReviewQuestionNotice(1,true)).toBeNull();
    const attempts=[
      {id:"a",attemptNumber:1,submittedAt:"2099-01-01T00:00:00Z"},
      {id:"b",attemptNumber:2,submittedAt:"2099-01-01T00:00:01Z"},
      {id:"invalid",attemptNumber:Number.NaN,submittedAt:"2099-01-01T00:00:02Z"},
    ];
    expect(selectLearnerLatestQuizAttempt(attempts)?.id).toBe("b");
    expect(selectLearnerLatestQuizAttempt([])).toBeNull();
    expect(learnerQuizAttemptDateLabel(new Date("not-a-date"))).toBe("Date unavailable");
    expect(learnerQuizAttemptDateLabel(new Date("2099-12-31T20:30:00Z")))
      .toContain("2100");
  });
});
