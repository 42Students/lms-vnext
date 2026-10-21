import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Retired: a recruiter session belongs to one college, so there is no list of colleges to browse.
 * Old links and bookmarks land on Home, which shows the college workspace (or the college chooser
 * for a college-less session on the global domain).
 */
export default function RecruiterCollegesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/recruiter/home"); }, [router]);
  return null;
}
