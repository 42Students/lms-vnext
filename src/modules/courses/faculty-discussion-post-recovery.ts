/** Unknown discussion POST outcomes must be reconciled against an authorized
 * fresh read before retry. A 2xx with an unconfirmed body is also unknown.
 */
export function facultyDiscussionPostNeedsReadback(status:number|null):boolean{
 return status===null||status===408||status===409||status===412||status>=500;
}
