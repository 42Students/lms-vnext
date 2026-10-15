/** Cohort safety is required, but offers/employers are not unique-student counts. */
export function publicIndependentPlacementCount(count:number|null,population:number|null){
 return count!==null && Number.isSafeInteger(count) && count>=5 &&
  population!==null && Number.isSafeInteger(population) && population>=5?count:null;
}
