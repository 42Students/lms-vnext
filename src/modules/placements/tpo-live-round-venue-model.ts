export function tpoLiveRoundVenueLabel(venue:string|null):string{
 return venue?.trim() ? "Recorded venue: "+venue.trim() : "Venue not recorded";
}
