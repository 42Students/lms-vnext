import {NextResponse} from "next/server";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {getPublicCollegeBranding} from "@/modules/colleges/branding-service";
import {readOptionalPublicPlacementData} from "@/modules/placements/public-page/optional-read-model";
import {getPublicPlacementPageContent} from "@/modules/placements/public-page/content-service";
import {getPublicPlacementStatistics} from "@/modules/placements/public-page/read-service";
import {publicPlacementTableReady} from "@/modules/placements/public-page/readiness";
import {DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS,formatPublicPlacementMetric}
  from "@/modules/placements/public-page/content-model";
import {publicPlacementDisclosure} from "@/modules/placements/public-placement-disclosure-model";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const headers={"Cache-Control":"no-store, max-age=0"};
const unavailable=()=>NextResponse.json({error:"PUBLIC_PLACEMENTS_UNAVAILABLE"},
  {status:503,headers});
const missing=()=>NextResponse.json({error:"PAGE_NOT_FOUND"},
  {status:404,headers});

/** Legacy guest GET compatibility for public placements pages. Resolve the
 * college from its verified hostname, never an untrusted query college ID.
 * Return only publication-approved aggregates; a hidden number is omitted
 * rather than returned as a zero or an identifiable small population. */
export async function GET(request:Request){
  const tenant=await resolveRequestTenant(request.headers.get("host"));
  if(tenant.kind!=="college")return missing();
  try{
    if(!await publicPlacementTableReady())return unavailable();
    const [branding,publication,content]=await Promise.all([
      readOptionalPublicPlacementData(()=>getPublicCollegeBranding(tenant.collegeId)),
      readOptionalPublicPlacementData(()=>getPublicPlacementStatistics(tenant.collegeId)),
      readOptionalPublicPlacementData(()=>getPublicPlacementPageContent(tenant.collegeId)),
    ]);
    if(!branding.available||!publication.available||!content.available||
       content.value?.ready===false)return unavailable();
    if(!branding.value||!publication.value)return missing();
    const data=publication.value;
    const keys=content.value?.metricKeys??DEFAULT_PUBLIC_METRICS;
    const facts={
      population:data.population??null,placed:data.placed??null,
      offers:data.offers??null,employers:data.employers??null,
      highestCtcInr:data.highestCtcInr??null,
      medianCtcInr:data.medianCtcInr??null,
    };
    const released=publicPlacementDisclosure([
      {label:"Students placed",count:facts.placed},
      {label:"Offers received",count:facts.offers},
      {label:"Recruiting employers",count:facts.employers},
    ]);
    const labels:Readonly<Partial<Record<string,string>>>={
      PLACED:"Students placed",OFFERS:"Offers received",
      HIRING_COMPANIES:"Recruiting employers",
    };
    const numbers=keys.flatMap(key=>{
      const privacyLabel=labels[key];
      if(privacyLabel&&released.some(item=>item.label===privacyLabel&&item.suppressed))return [];
      const value=formatPublicPlacementMetric(key,facts);
      if(value===null)return [];
      // The legacy JSON contract uses PLACED_PERCENT and COMPANIES; the vNext
      // selected-key policy uses PERCENT and HIRING_COMPANIES.
      const oldKey=key==="PERCENT"?"PLACED_PERCENT":
        key==="HIRING_COMPANIES"?"COMPANIES":key;
      return [{key:oldKey,label:PUBLIC_METRIC_LABELS[key],value}];
    });
    return NextResponse.json({
      collegeName:branding.value.collegeName,
      about:content.value?.about??null,
      numbers,
    },{headers});
  }catch{return unavailable();}
}
