/** T-S2-08: salary order statistics require five DISTINCT learners with
 * known CTC, not merely five offers which could expose one learner's salary.
 */
export function publicSalaryMetricsAllowed(distinctLearnersWithCtc:number,population:number|null){
 return population!==null&&Number.isSafeInteger(population)&&population>=5&&
  Number.isSafeInteger(distinctLearnersWithCtc)&&distinctLearnersWithCtc>=5&&
  distinctLearnersWithCtc<=population;
}
