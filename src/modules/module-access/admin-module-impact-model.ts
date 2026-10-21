export function moduleDisableImpactSummary(module:"projects"|"placements"|"electives",counts:number[]){
 const needed=module==="projects"?1:module==="placements"?4:0;
 if(counts.length<needed||counts.slice(0,needed).some(value=>!Number.isSafeInteger(value)||value<0))
  return "Impact counts unavailable. Recheck this college before changing module access.";
 if(module==="projects")return `Projects: ${counts[0]} active primary-mentor assignments may lose access. This is not a safety check.`;
 if(module==="placements")return `Placements: ${counts[0]} active drives, ${counts[1]} in-progress applications and ${counts[2]} pending offers and ${counts[3]} upcoming interviews may be affected. Existing data is retained.`;
 return "Electives: access changes may affect learner choices. No deletion is performed.";
}
