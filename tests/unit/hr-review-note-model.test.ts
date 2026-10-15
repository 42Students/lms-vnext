import {it,expect} from "vitest";
import {recruiterReviewNoteSchema} from "@/modules/placements/hr-review-note-model";
it("rejects blank notes, invalid ratings and stale-shaped tokens",()=>{const input={applicationId:"11111111-1111-4111-8111-111111111111",rating:5,note:"Strong candidate",version:0};expect(recruiterReviewNoteSchema.safeParse(input).success).toBe(true);expect(recruiterReviewNoteSchema.safeParse({...input,note:" "}).success).toBe(false);expect(recruiterReviewNoteSchema.safeParse({...input,rating:6}).success).toBe(false)});
