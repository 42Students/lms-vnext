import { useCallback, useEffect, useState } from "react";
import { getRecruiterMe } from "@/api/Services/RecruiterService";

/**
 * The college this session belongs to, resolved from the server once. A recruiter session is for exactly one college;
 * `needsCollege` is true only for the college-less chooser session, which has no workspace pages to show.
 */
export default function useRecruiterCollege() {
  const [state, setState] = useState({ loading: true, error: false, collegeId: null, collegeName: "", user: null, needsCollege: false });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: false }));
    getRecruiterMe()
      .then((res) => {
        const me = res?.data;
        if (me?.scope === "COLLEGE" && me.collegeId) {
          setState({ loading: false, error: false, collegeId: me.collegeId, collegeName: me.user?.collegeName || "", user: me.user || null, needsCollege: false });
        } else {
          setState({ loading: false, error: false, collegeId: null, collegeName: "", user: me?.user || null, needsCollege: true });
        }
      })
      .catch(() => setState({ loading: false, error: true, collegeId: null, collegeName: "", user: null, needsCollege: false }));
  }, []);

  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
