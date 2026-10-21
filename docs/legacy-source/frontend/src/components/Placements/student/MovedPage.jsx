import { useEffect } from "react";
import { useRouter } from "next/router";
import { Skeleton } from "antd";

/**
 * A placements address that moved in the redesign (14 Oct 2026): notices, emails and bookmarks still point at it, so it sends the
 * student on to the new page instead of a 404.
 */
export default function MovedPage({ to }) {
  const router = useRouter();
  useEffect(() => {
    if (router.isReady) router.replace(to);
  }, [router, router.isReady, to]);
  return <Skeleton active paragraph={{ rows: 3 }} />;
}
