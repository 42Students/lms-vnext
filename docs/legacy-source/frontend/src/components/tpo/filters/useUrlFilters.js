import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { fromQuery, mergeQuery } from "./filterModel";

/**
 * Filter state kept in the page URL, so a view can be bookmarked, shared and comes back on refresh.
 * Returns [state, setState]. Only the f_* query keys are touched.
 */
export default function useUrlFilters(defs) {
  const router = useRouter();
  const query = router?.query;
  const state = useMemo(() => fromQuery(defs, query || {}), [defs, query]);
  const setState = useCallback((next) => {
    if (!router) return;
    router.replace({ pathname: router.pathname, query: mergeQuery(router.query, defs, next || {}) }, undefined, { shallow: true, scroll: false });
  }, [router, defs]);
  return [state, setState];
}
