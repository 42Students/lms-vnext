import {it,expect} from "vitest";
import {tpoRequestContextLink} from "@/modules/placements/tpo-global-requests-model";
it("links recorded target IDs only through protected TPO workspaces",()=>{
 const base={jobId:"job",roundId:null,offerId:null,requestType:"APPLICATION_WITHDRAWAL"};
 expect(tpoRequestContextLink(base)).toEqual({href:"/tpo/placements/jobs/job",label:"Open drive"});
 expect(tpoRequestContextLink({...base,requestType:"ROUND_RESCHEDULE",roundId:"round"}).href).toBe("/tpo/drive-day/round");
 expect(tpoRequestContextLink({...base,requestType:"OFFER_EXTENSION",offerId:"offer"}).href).toBe("/tpo/placements/jobs/job/joining");
 expect(tpoRequestContextLink({...base,requestType:"ROUND_RESCHEDULE"}).href).toBe("/tpo/placements/jobs/job");
});
