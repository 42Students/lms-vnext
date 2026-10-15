import {describe,expect,it} from "vitest";
import {learnerAttemptResultLabel,ownQuizHistorySelection} from "@/modules/courses/learner-quiz-history-model";
const quizId="81818181-8181-4818-8818-818181818181";
const deliveryId="82828282-8282-4828-8828-828282828282";
const other="83838383-8383-4838-8838-838383838383";
describe("own learner quiz attempt history selector",()=>{
  it("accepts only an exact visible quiz/delivery and optional UUID attempt",()=>{
    const rows=[{id:quizId,deliveryId,title:"Own quiz"}];
    expect(ownQuizHistorySelection(rows,{quizId,deliveryId})?.quiz.title).toBe("Own quiz");
    expect(ownQuizHistorySelection(rows,{quizId,deliveryId,attemptId:other})?.attemptId).toBe(other);
    expect(ownQuizHistorySelection(rows,{quizId,deliveryId:other})).toBeNull();
    expect(ownQuizHistorySelection(rows,{quizId,deliveryId,attemptId:"bad"})).toBeNull();
    expect(ownQuizHistorySelection(rows,{quizId,deliveryId,collegeId:other})).toBeNull();
  });
  it("never turns a withheld or null score into a public result",()=>{
    expect(learnerAttemptResultLabel({resultsVisible:false,score:9,maxScore:10})).toBe("Result not published");
    expect(learnerAttemptResultLabel({resultsVisible:true,score:null,maxScore:10})).toBe("Score unavailable");
    expect(learnerAttemptResultLabel({resultsVisible:true,score:9,maxScore:10})).toBe("9 / 10 points");
  });
});