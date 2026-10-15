import {it,expect} from "vitest";
import {campaignSourceSchema} from "@/modules/messaging/campaign-source-model";
it("requires attribution details for other sources",()=>{expect(campaignSourceSchema.safeParse({source:"OTHER"}).success).toBe(false);expect(campaignSourceSchema.safeParse({source:"EVENT"}).success).toBe(true)});
