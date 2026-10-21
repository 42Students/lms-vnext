import moment from "moment";

export function parsePlacementUtcDateTime(raw) {
  if (raw == null || raw === "") return null;
  if (moment.isMoment(raw)) return raw.isValid() ? raw.clone().local() : null;
  if (raw instanceof Date) {
    const m = moment(raw);
    return m.isValid() ? m.local() : null;
  }
  if (Array.isArray(raw)) {
    if (raw.length < 3) return null;
    const [yr, mr, dr, hr = 0, mir = 0, sr = 0, nr = 0] = raw;
    const year=Number(yr), month=Number(mr), day=Number(dr), hour=Number(hr), minute=Number(mir), second=Number(sr), nano=Number(nr);
    if (![year,month,day,hour,minute,second,nano].every(Number.isFinite)) return null;
    if (month<1||month>12||day<1||day>31||hour<0||hour>23||minute<0||minute>59||second<0||second>59||nano<0||nano>999999999) return null;
    const millisecond=Math.floor(nano/1e6);
    const m=moment.utc([year,month-1,day,hour,minute,second,millisecond]);
    if (!m.isValid()) return null;
    if (m.year()!==year||m.month()!==month-1||m.date()!==day||m.hour()!==hour||m.minute()!==minute||m.second()!==second||m.millisecond()!==millisecond) return null;
    return m.local();
  }
  const m=moment.utc(raw);
  return m.isValid() ? m.local() : null;
}

export function placementDateTimeToIso(raw) {
  const m=parsePlacementUtcDateTime(raw);
  return m ? m.clone().utc().toISOString() : null;
}

export function parsePlacementCalendarDate(raw) {
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    const m=moment(raw.trim(),"YYYY-MM-DD",true);
    return m.isValid() ? m : null;
  }
  return parsePlacementUtcDateTime(raw);
}

export function placementLocalDateKey(raw) {
  const m=parsePlacementUtcDateTime(raw);
  return m ? m.format("YYYY-MM-DD") : null;
}


export function formatPlacementDateShort(raw, fallback = "-") {
  const m = parsePlacementUtcDateTime(raw);
  return m ? m.format("DD MMM YYYY") : fallback;
}

export function formatPlacementDateTime(raw, fallback = "-") {
  const m = parsePlacementUtcDateTime(raw);
  return m ? m.format("DD MMM YYYY, hh:mm A") : fallback;
}

/**
 * A moment from whatever the API sent for a date: the array form [2026,10,12,7,21] (how a LocalDateTime is serialised on entity payloads)
 * is read as the stored UTC time; strings and Dates behave exactly as moment(value) always did. `moment([2026,10,12])` alone would be
 * a month out, because moment arrays count months from zero.
 */
export function momentFromApi(raw) {
  if (Array.isArray(raw)) return parsePlacementUtcDateTime(raw) || moment.invalid();
  return moment(raw);
}
