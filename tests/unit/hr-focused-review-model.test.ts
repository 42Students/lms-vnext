import {it,expect} from "vitest";
import {focusedReviewNavigation} from "@/modules/placements/hr-focused-review-model";
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
it("steps through scoped candidate ids without index overflow",()=>{expect(focusedReviewNavigation({candidateIds:[a,b],currentId:a})).toEqual({index:0,total:2,previous:null,next:b})});
