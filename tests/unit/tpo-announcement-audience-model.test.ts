import {it,expect} from "vitest";
import {tpoAudienceSchema} from "@/modules/announcements/tpo-audience-model";
it("rejects empty chosen audience",()=>{expect(tpoAudienceSchema.safeParse({kind:"BATCHES",batchIds:[]}).success).toBe(false);expect(tpoAudienceSchema.safeParse({kind:"ALL_ACTIVE"}).success).toBe(true)});
