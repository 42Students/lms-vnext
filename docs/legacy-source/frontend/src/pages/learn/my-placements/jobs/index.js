import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JobsListContent from "@/components/Placements/JobsListContent";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";

export default function MyPlacementsJobs() {
  const router = useRouter();
  const historyNavigationRef = useRef(false);
  const [historyRevision, setHistoryRevision] = useState(0);

  // JobsListContent intentionally hydrates its controlled search field only on
  // mount. Rehydrate on browser Back/Forward, *after* Next has updated the URL;
  // do not remount for its own debounced router.replace while the user types.
  useEffect(() => {
    const onPopState = () => { historyNavigationRef.current = true; };
    const onRouteComplete = (url) => {
      if (!historyNavigationRef.current) return;
      historyNavigationRef.current = false;
      if (url.split("?")[0].split("#")[0] === "/learn/my-placements/jobs") {
        setHistoryRevision((revision) => revision + 1);
      }
    };
    const onRouteError = () => { historyNavigationRef.current = false; };
    window.addEventListener("popstate", onPopState);
    router.events.on("routeChangeComplete", onRouteComplete);
    router.events.on("routeChangeError", onRouteError);
    return () => {
      window.removeEventListener("popstate", onPopState);
      router.events.off("routeChangeComplete", onRouteComplete);
      router.events.off("routeChangeError", onRouteError);
    };
  }, [router.events]);

  return <JobsListContent key={historyRevision} basePath="/learn/my-placements" />;
}

MyPlacementsJobs.getLayout = (page) => PlacementsTabsLayout(page);
