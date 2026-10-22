/** TPO last-third: keep the same scoped request collection under one URL
 * interpretation. Repeated query keys are ambiguous and must not be selected
 * with first(), even when the first value looks authorized.
 */
export function tpoStudentRequestsHasInvalidUrlFilters(
 raw:Record<string,string|string[]|undefined>,
):boolean{
 const accepted=new Set(["status","search","page","pageSize","includeDecided","decidedDays"]);
 return Object.keys(raw).some(key=>!accepted.has(key))||
  Object.values(raw).some(Array.isArray)||
  (raw["includeDecided"]!==undefined&&raw["includeDecided"]!=="0"&&raw["includeDecided"]!=="1")||
  (raw["decidedDays"]!==undefined&&raw["decidedDays"]!=="0"&&
   !(typeof raw["decidedDays"]==="string"&&/^[1-9][0-9]{0,2}$/.test(raw["decidedDays"])
    &&Number(raw["decidedDays"])<=365));
}
