import { useEffect, useState } from "react";
import { getChoices } from "@/api/Services/ChoicesService";
import { FALLBACK_CHOICES } from "@/config/choices";

export { FALLBACK_CHOICES };

/**
 * The values every dropdown and filter offers, from GET /api/v1/choices (one source, so a form, a filter and a report never
 * disagree). Lists are [{ value, label }]. Fetched once per page load and shared; until it arrives (or if it fails) the fixed
 * lists in config/choices are used, so a form never shows an empty dropdown. Branches and passing years are the college's own and have no
 * fallback.
 */

let cache = null; // { data } once loaded
let inflight = null;

function load() {
  if (!inflight) {
    inflight = getChoices()
      .then((res) => {
        const data = res?.data && typeof res.data === "object" ? res.data : {};
        cache = { data: { ...FALLBACK_CHOICES, ...Object.fromEntries(Object.entries(data).filter(([, v]) => Array.isArray(v))) } };
        return cache.data;
      })
      .catch(() => { inflight = null; return FALLBACK_CHOICES; }); // try again next time a page asks
  }
  return inflight;
}

/** For tests: forget what was loaded. */
export function resetChoicesCache() { cache = null; inflight = null; }

export default function useChoices() {
  const [choices, setChoices] = useState(cache?.data || FALLBACK_CHOICES);
  useEffect(() => {
    let live = true;
    if (!cache) load().then((d) => { if (live) setChoices(d); });
    return () => { live = false; };
  }, []);
  return choices;
}

/** The username from what a student typed (a username or the platform's profile link), or null when it is a link to another site. */
export function codingUsername(platform, raw) {
  let v = String(raw || "").trim();
  if (!v) return "";
  const host = (platform.urlPrefix || "").replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  if (v.includes("/") || v.toLowerCase().includes(host)) {
    const m = v.match(/^(?:https?:\/\/)?([^/?#]+)(.*)$/i);
    if (!m || m[1].toLowerCase().replace(/^www\./, "") !== host) return null;
    const parts = m[2].replace(/[?#].*$/, "").replace(/\/+$/, "").split("/");
    v = parts[parts.length - 1] || "";
    if (v.startsWith("@")) v = v.slice(1);
  }
  return v;
}

/** "" when fine, otherwise a plain sentence. */
export function codingProblem(platform, raw) {
  if (!String(raw || "").trim()) return "";
  const u = codingUsername(platform, raw);
  if (u === null) return `That link is not a ${platform.label} profile. Type your username instead.`;
  if (!new RegExp(`^(?:${platform.pattern})$`).test(u)) return `${platform.label} username should be ${platform.hint}.`;
  return "";
}
