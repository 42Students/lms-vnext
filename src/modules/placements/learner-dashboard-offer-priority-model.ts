import type {PlacementDashboardOffer} from "./learner-dashboard-model";
const DAY=24*60*60*1000;
/** Only valid, unexpired issued offers expiring in the next day are urgent. */
export function learnerExpiringOffer(
  offers:readonly PlacementDashboardOffer[],nowMs:number,
):{expiresAt:Date}|null{
  const eligible=offers.filter(o=>o.status==="ISSUED"&&o.expiresAt!==null)
    .map(o=>o.expiresAt!)
    .filter(date=>{
      const at=date.getTime();
      return Number.isFinite(at)&&at>=nowMs&&at<=nowMs+DAY;
    }).sort((a,b)=>a.getTime()-b.getTime());
  return eligible[0]?{expiresAt:eligible[0]}:null;
}
