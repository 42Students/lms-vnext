/** External 2xx is not proof of accepted SMS: require provider SID and affirmative state. */
export function isExotelAcceptedResponse(raw:unknown):boolean{
 if(!raw || typeof raw!=="object" || !("SMSMessage" in raw))return false;
 const message=raw.SMSMessage;
 if(!message || typeof message!=="object")return false;
 if(!("Sid" in message)||typeof message.Sid!=="string"||!message.Sid.trim())return false;
 if(!("Status" in message)||typeof message.Status!=="string")return false;
 const status=message.Status.trim().toLowerCase();
 return status==="queued"||status==="submitted"||status==="sent"||
  status==="accepted"||status==="delivered";
}
