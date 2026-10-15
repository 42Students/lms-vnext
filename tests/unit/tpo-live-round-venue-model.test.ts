import {it,expect} from "vitest";
import {tpoLiveRoundVenueLabel} from "@/modules/placements/tpo-live-round-venue-model";
it("shows stored venue as-is without inventing a physical location",()=>{
 expect(tpoLiveRoundVenueLabel(" Hall B ")).toBe("Recorded venue: Hall B");
 expect(tpoLiveRoundVenueLabel(null)).toBe("Venue not recorded");
 expect(tpoLiveRoundVenueLabel("  ")).toBe("Venue not recorded");
});
