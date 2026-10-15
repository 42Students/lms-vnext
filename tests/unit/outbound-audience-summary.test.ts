import {it,expect} from "vitest";
import {summarizeAudience} from "@/modules/messaging/audience-summary";
it("counts suppressed reasons separately",()=>{expect(summarizeAudience([{status:"QUEUED"},{status:"SUPPRESSED",reason:"unsubscribed"},{status:"SUPPRESSED",reason:"unsubscribed"}])).toEqual({total:3,eligible:1,suppressed:2,reasons:{unsubscribed:2}})});
