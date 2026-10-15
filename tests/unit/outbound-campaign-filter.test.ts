import {it,expect} from "vitest";
import {campaignFilterHref} from "@/modules/messaging/campaign-filter-model";
it("keeps escaped search and filter state",()=>expect(campaignFilterHref({state:"UNASSIGNED",search:"a&b",page:2})).toBe("/tpo/recruiters?state=UNASSIGNED&page=2&q=a%26b"));
