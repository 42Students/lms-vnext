import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction } from "@/redux/store";

// One learner's academic scope (their class), shared by every learner page (LRN-X-01).
//
// Login state does not always carry classId. Pages used to read it differently: the course page
// fetched it, All Quizzes showed zero quizzes, Calendar said "not assigned to a class". This hook
// is the single way to get it: it fills a missing classId from the learner's own record once, and
// says which situation applies so a page never mistakes "not loaded yet" or "could not load" for
// "has no class".
//
// status: "ready" (classId known) | "loading" | "none" (the learner really has no class) | "error"

const inflight = new Map(); // learnerId -> Promise<classId|null>, so several pages share one request

function fetchLearnerClassId(learnerId) {
  if (!inflight.has(learnerId)) {
    const p = import("@/api/Services/UserServices")
      .then(({ getStudentDetails }) => getStudentDetails(learnerId))
      .then((response) => {
        const learner = response?.data?.data;
        const classId = learner?.classId ?? learner?.class_id;
        return classId != null ? classId : null;
      })
      .finally(() => {
        // Keep a settled result only briefly; a later visit should re-check.
        setTimeout(() => inflight.delete(learnerId), 30000);
      });
    inflight.set(learnerId, p);
  }
  return inflight.get(learnerId);
}

// enabled=false (e.g. a component shared with staff) skips the lookup entirely.
export default function useLearnerClassScope({ enabled = true } = {}) {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const learnerId = loginUser?.id;
  const classId = loginUser?.classId ?? null;
  const loggedIn = Boolean(loginUser?.isUserLoggedIn);
  const [status, setStatus] = useState(!enabled || classId != null ? "ready" : "loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || classId != null) { setStatus("ready"); return undefined; }
    if (!learnerId || !loggedIn) { setStatus("loading"); return undefined; }
    let cancelled = false;
    setStatus("loading");
    fetchLearnerClassId(learnerId)
      .then((found) => {
        if (cancelled) return;
        if (found != null) {
          dispatch(loginUserAction.handleUserData({ classId: found }));
          setStatus("ready");
        } else {
          setStatus("none");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => { cancelled = true; };
  }, [enabled, classId, learnerId, loggedIn, attempt, dispatch]);

  const retry = useCallback(() => {
    if (learnerId) inflight.delete(learnerId);
    setAttempt((n) => n + 1);
  }, [learnerId]);

  return { classId, status, retry };
}
