/** Legacy BigDecimal CTC in LPA is preserved verbatim in
 * placement_offers.legacy_ctc_lpa. The integer annual headline is a derived
 * INR amount rounded half-up to the nearest rupee, NEVER an IEEE float.
 * 1 LPA = INR 100,000. Reject invalid, negative and int32 overflow values
 * for explicit source/import review; do not silently truncate salaries. */
export function legacyOfferCtcToAnnualInr(raw:string|null):number|null{
 if(raw===null)return null;
 const source=raw.trim();
 const match=/^(0|[1-9][0-9]{0,12})(?:\.([0-9]{1,30}))?$/.exec(source);
 if(!match)throw new Error("Invalid source LPA decimal");
 const integer=BigInt(match[1]);
 const fractional=(match[2]??"");
 const places=fractional.length;
 const scale=10n**BigInt(places);
 const decimal=BigInt(fractional||"0");
 const numerator=(integer*scale+decimal)*100000n;
 const rounded=(numerator*2n+scale)/(2n*scale);
 if(rounded>2147483647n)
  throw new Error("Source LPA exceeds supported annual salary");
 return Number(rounded);
}
export function legacyOfferMoneyProjection(raw:string|null){
 return {legacyCtcLpa:raw,annualCtcInr:legacyOfferCtcToAnnualInr(raw)};
}
