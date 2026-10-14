/** Regrading a previously learner-visible score must explain the change. */
export function facultyRegradeFeedbackAllowed(wasPublished:boolean,feedback:string|null|undefined){
 return !wasPublished || (feedback?.trim().length??0)>=8;
}
