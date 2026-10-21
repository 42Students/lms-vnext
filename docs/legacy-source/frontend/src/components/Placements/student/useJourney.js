import { useCallback, useEffect, useState } from "react";
import { getPlacementJourney, getPlacementOverview } from "@/api/Services/TpoHubService";

const validJourney = (v) => Boolean(v && Array.isArray(v.applications) && Array.isArray(v.schedule) && Array.isArray(v.offers));
const validOverview = (v) => Boolean(v && typeof v === "object" && v.registration && typeof v.registration === "object");

/**
 * The student's placements, read once per page: the journey (applications with their rounds, schedule, offers) and the placement
 * cell overview (registration, requests, debarments, notices). `withOverview: false` skips the second read.
 * A failed read is never shown as "you have nothing": `failed` is set and the page offers Retry.
 */
export default function useJourney({ withOverview = true } = {}) {
  const [journey, setJourney] = useState(null);
  const [overview, setOverview] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [j, o] = await Promise.all([
        getPlacementJourney(),
        withOverview ? getPlacementOverview() : Promise.resolve(null),
      ]);
      if (!validJourney(j?.data) || (withOverview && !validOverview(o?.data))) {
        setFailed(true);
        return;
      }
      setJourney(j.data);
      if (withOverview) setOverview(o.data);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [withOverview]);

  useEffect(() => { load(); }, [load]);

  return { journey, overview, failed, loading, reload: load };
}
