/** PUB-auth-public-31: stable, customer-safe global connection messages. */
export type PublicNetworkNotice="Request timed out"|"Connection problem"|"Server Error"|"Your session has not been cleared.";
export function publicNetworkNotice(input:{status:number;isSessionChange?:boolean}):PublicNetworkNotice|null{
 if(input.isSessionChange&&[0,502,503,504].includes(input.status))
  return "Your session has not been cleared.";
 if(input.status===504||input.status===408||input.status===499)return "Request timed out";
 if(input.status===0)return "Connection problem";
 if(input.status>=500&&input.status<=599)return "Server Error";
 return null;
}
