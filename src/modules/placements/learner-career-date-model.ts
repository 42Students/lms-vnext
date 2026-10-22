import { z } from "zod";
/** YYYY-MM-DD calendar day in IST, never a browser-local time conversion. */
const careerDateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export function parseLearnerCareerDate(raw:unknown):string|null {
  const value=careerDateSchema.safeParse(raw);
  if(!value.success)return null;
  const [year,month,day]=value.data.split("-").map(Number);
  if(year===undefined||month===undefined||day===undefined||year<2000||year>2100||month<1||month>12||day<1||day>31)return null;
  const date=new Date(Date.UTC(year,month-1,day));
  return date.toISOString().slice(0,10)===value.data ? value.data : null;
}
