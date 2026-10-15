import {it,expect} from "vitest";
import {recruiterTodayHref} from "@/modules/placements/hr-today-deeplink-model";
const id="11111111-1111-4111-8111-111111111111";
it("builds only typed recruiter task routes",()=>{expect(recruiterTodayHref({kind:"FIX_DRIVE",jobId:id})).toBe("/recruiter/drives/new?fix="+id);expect(()=>recruiterTodayHref({kind:"FIX_DRIVE",jobId:"../admin"})).toThrow()});
