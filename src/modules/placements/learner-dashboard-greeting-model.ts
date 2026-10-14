/** Display only a bounded human-readable greeting, never private contacts. */
export function learnerPlacementHeroGreeting(name:string|null|undefined,firstRun:boolean|null){
 const normalized=(name??"").trim().replace(/\s+/g," ").slice(0,80);
 const prefix=firstRun===true?"Welcome to placements":"Your placement overview";
 return normalized?prefix+", "+normalized:prefix;
}
