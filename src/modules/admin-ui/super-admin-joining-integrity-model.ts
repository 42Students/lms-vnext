/** Visible exception, not a fabricated change to the stored offer or joining record. */
export function superAdminJoiningIntegrityNote(
  joiningStatus:string,
  offerStatus:string,
):string|null{
  if(joiningStatus==="JOINED"&&offerStatus!=="ACCEPTED")
    return "Review required: joining is recorded without an accepted offer.";
  return null;
}
