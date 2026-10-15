/** Guard duplicate Load older clicks before React's loading flag rerenders.
 * A failure releases the lock so the same cursor can be retried. */
export function createLearnerDiscussionHistoryFlight(){
 let busy=false;
 return {
  begin(){if(busy)return false;busy=true;return true;},
  end(){busy=false;},
  isBusy(){return busy;},
 };
}
