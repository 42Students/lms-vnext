export type MentorSearchFeedback="IDLE"|"LOADING"|"EMPTY"|"FAILED"|"RESULTS";
/** A pending/stale search is never announced as an empty authorized result. */
export function mentorSearchFeedback(input:{
 portal:string;query:string;lookupTerm:string;
 pending:boolean;failed:boolean;resultCount:number;
}):MentorSearchFeedback{
 const term=input.query.trim().slice(0,100);
 if(input.portal!=="mentor"||term.length<2)return "IDLE";
 if(term!==input.lookupTerm||input.pending)return "LOADING";
 if(input.failed)return "FAILED";
 return input.resultCount>0?"RESULTS":"EMPTY";
}
