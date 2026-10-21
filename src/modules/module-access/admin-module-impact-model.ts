export function moduleDisableImpactSummary(module:"projects"|"placements"|"electives",counts:number[],collegeName?:string){
 const needed=module==="projects"?1:module==="placements"?4:0;
 const location=collegeName?" at "+collegeName:"";
 if(counts.length<needed||counts.slice(0,needed).some(value=>!Number.isSafeInteger(value)||value<0))
  return module==="projects"
   ?"Mentor-impact data is unavailable. This does not mean disabling Projects is safe: check active workspaces, learner submissions and upcoming meetings before proceeding."
   :"Impact counts unavailable. Recheck this college before changing module access; this is not proof that disabling it is safe.";
 if(module==="projects"){
  const mentors=counts[0]!;
  if(mentors===0)return `No active primary mentors were found${location}. This is not a safety check: review workspaces, learners, submissions and upcoming meetings before disabling Projects.`;
  return `${mentors} active primary-mentor assignment${mentors===1?" is":"s are"} recorded${location}. Learners, other members, pending submissions and meetings may also be affected.`;
 }
 if(module==="placements")return `Placements: ${counts[0]} active drives, ${counts[1]} in-progress applications, ${counts[2]} pending offers and ${counts[3]} upcoming interviews may be affected. Existing data is retained; this is not a safety check.`;
 return "Electives: access changes may affect learner choices. No deletion is performed; review current allocations before changing access.";
}
