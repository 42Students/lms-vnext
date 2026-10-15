/** An unsigned, whole-rupee saved amount is displayable; invalid figures are not salaries. */
export function learnerOfferCtc(value:number|null):number|null{
 return value!==null&&Number.isSafeInteger(value)&&value>=0?value:null;
}
