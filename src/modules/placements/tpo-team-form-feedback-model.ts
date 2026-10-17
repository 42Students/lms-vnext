export function tpoTeamFormErrorMessage(code:string,kind:"CREATE"|"REPLY"):string{
 if(code==="TEAM_TABLES_PENDING")return "Conversations are temporarily unavailable. Try again later.";
 if(code==="RECIPIENT_NOT_FOUND"||code==="TEAM_PARTICIPANT_INACTIVE")
  return "That colleague is no longer available in this placement team. Choose someone active.";
 if(code==="SESSION_EXPIRED")return "Your session has ended. Please sign in again. Your draft is saved.";
 if(code==="STALE_MESSAGE")return "This changed while you were working. Your message is kept below; check it before retrying.";
 if(code==="NOT_FOUND")return "This conversation is no longer available.";
 if(code==="FORBIDDEN"||code==="INVALID_ORIGIN")return "You do not have permission to change this conversation.";
 if(code==="INVALID_BODY")return kind==="CREATE"?"Choose a team member and give the conversation a topic.":"Write a message before sending.";
 return kind==="CREATE"?"Couldn't start it. Please try again.":"Could not send. Please try again.";
}
