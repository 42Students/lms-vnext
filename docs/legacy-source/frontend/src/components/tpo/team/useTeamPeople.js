import { useEffect, useState } from "react";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getTeamPeople } from "@/api/Services/TpoHubService";

/** The placement team for @ and Ask in an embedded Team conversation (a drive or company page): loaded when it is shown. */
export default function useTeamPeople(enabled, fallbackMeId) {
  const [people, setPeople] = useState([]);
  const [meId, setMeId] = useState(fallbackMeId || null);
  useEffect(() => {
    if (!enabled) return undefined;
    let gone = false;
    fetchWithErrorHandling(getTeamPeople()).then((r) => {
      if (gone || !r.success) return;
      const list = r.data?.people || [];
      setPeople(list.map((p) => ({ facultyId: p.facultyId, name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.email || `#${p.facultyId}`, awayUntil: p.awayUntil })));
      const me = list.find((p) => p.me);
      if (me) setMeId(me.facultyId);
    });
    return () => { gone = true; };
  }, [enabled]);
  return { people, meId };
}
