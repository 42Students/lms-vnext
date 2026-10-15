/** An opt-in publication must be recent, not future dated or silently indefinite. */
export function publicPublicationFresh(publishedAt:Date|null,now:Date,maxAgeDays=366){
 const published=publishedAt?.getTime();
 const current=now.getTime();
 return typeof published==="number"&&Number.isFinite(published) &&
  Number.isFinite(current)&&published<=current &&
  Number.isSafeInteger(maxAgeDays)&&maxAgeDays>0&&
  current-published<=maxAgeDays*86400000;
}
