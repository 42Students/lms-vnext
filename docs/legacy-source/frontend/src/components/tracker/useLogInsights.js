import { useCallback, useEffect, useRef, useState } from "react";
import { getDeployHealth, getDeploys, getKnownErrors, getLogDigest } from "@/api/Services/SuperAdminLogsService";
import { normalizeDeploy, normalizeDigest, normalizeKnownError } from "@/utils/instant";

/**
 * The supporting data around a log view: what was decided about each tracked error, the recent
 * deploys (with a before/after health check for the latest), and the daily digest. Every piece is
 * optional; a failing endpoint just leaves its part of the page out instead of breaking the list.
 */
export default function useLogInsights(environment) {
  const [knownByHash, setKnownByHash] = useState(() => new Map());
  const [deploys, setDeploys] = useState([]);
  const [health, setHealth] = useState(null);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const generationRef = useRef(0);

  const reloadKnown = useCallback(async () => {
    // BE-0064: a refresh that finishes after an environment switch (or a newer reload) is dropped.
    const generation = generationRef.current;
    try {
      const rows = await getKnownErrors(environment);
      if (generation !== generationRef.current) return;
      setKnownByHash(new Map((Array.isArray(rows) ? rows : []).map(normalizeKnownError).map((row) => [row.signatureHash, row])));
    } catch {
      // Keep the current labels: a failed refresh is not "no known errors".
    }
  }, [environment]);

  const reload = useCallback(async () => {
    const generation = ++generationRef.current;
    setLoading(true);
    setHealth(null);
    const [known, deployList, digestResult] = await Promise.all([
      getKnownErrors(environment).catch(() => []),
      getDeploys({ environment, days: 7 }).catch(() => []),
      environment === "PRODUCTION" ? getLogDigest(24).catch(() => null) : Promise.resolve(null),
    ]);
    if (generation !== generationRef.current) return;
    setKnownByHash(new Map((Array.isArray(known) ? known : []).map(normalizeKnownError).map((row) => [row.signatureHash, row])));
    const list = (Array.isArray(deployList) ? deployList : []).map(normalizeDeploy);
    setDeploys(list);
    setDigest(normalizeDigest(digestResult));
    setLoading(false);
    if (list[0]) {
      const result = await getDeployHealth({ environment, at: list[0].at }).catch(() => null);
      if (generation === generationRef.current) setHealth(result);
    }
  }, [environment]);

  useEffect(() => {
    reload();
    return () => {
      generationRef.current += 1;
    };
  }, [reload]);

  return { knownByHash, deploys, health, digest, loading, reload, reloadKnown };
}
