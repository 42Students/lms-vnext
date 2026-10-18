/** Prevent a second inbound-mail status PATCH in the same browser tick.
 * The UI's busy flag is visual feedback, not the concurrency authority.
 */
export function createInboundMailTriageGate(){
 let pending=false;
 return {
  tryBegin(){
   if(pending)return false;
   pending=true;
   return true;
  },
  end(){pending=false;},
 };
}
