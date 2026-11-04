import type { S3Config } from "@/modules/storage/s3-client";
import { awsEncode } from "@/modules/storage/s3-client";

/**
 * Fail-closed network destination guard for ZIP downloads of recruiter-shared
 * resumes. The applicant-share service must first prove token+PIN, current
 * shortlist and CLEAN storage attestation; this guard separately prevents a
 * signed URL string from becoming a server-side arbitrary-HTTPS fetch (SSRF).
 *
 * R2 grants are path-style and minted by createPrivateReadGrant for a
 * placement-document object owned by a college membership. This validator
 * does not itself authorize the applicant or verify the HMAC signature;
 * the R2 service verifies the latter when the request is made.
 */
export function isAllowedCompanyShareResumeDownload(
  raw: string,
  config: Pick<S3Config, "endpoint" | "bucket" | "keyPrefix" | "accessKeyId">,
  now = new Date(),
): boolean {
  let url: URL;
  let endpoint: URL;
  try {
    url = new URL(raw);
    endpoint = new URL(config.endpoint);
  } catch {
    return false;
  }
  if (
    url.protocol !== "https:" ||
    endpoint.protocol !== "https:" ||
    url.origin !== endpoint.origin ||
    url.username !== "" ||
    url.password !== "" ||
    url.hash !== ""
  ) return false;

  // Match the object naming contract, including the configured private
  // bucket and optional development prefix. Do not accept encoded slashes,
  // query-substituted keys, sibling namespaces or prefix matches.
  const prefixPath = "/" + (config.bucket + "/" +
    (config.keyPrefix ?? "") + "private/").split("/").map(awsEncode).join("/");
  if (!url.pathname.startsWith(prefixPath)) return false;
  const suffix = url.pathname.slice(prefixPath.length);
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  const privateResumePath = new RegExp(
    "^" + uuid + "/" + uuid + "/placement-document/" + uuid + "$", "i",
  );
  if (!privateResumePath.test(suffix)) return false;

  const unique = (key: string): string | null => {
    const values = url.searchParams.getAll(key);
    return values.length === 1 ? values[0]! : null;
  };
  const algorithm = unique("X-Amz-Algorithm");
  const credential = unique("X-Amz-Credential");
  const date = unique("X-Amz-Date");
  const expires = unique("X-Amz-Expires");
  const signedHeaders = unique("X-Amz-SignedHeaders");
  const signature = unique("X-Amz-Signature");
  const cachePolicy = unique("response-cache-control");
  if (
    algorithm !== "AWS4-HMAC-SHA256" ||
    signedHeaders !== "host" ||
    cachePolicy !== "private, no-store, max-age=0" ||
    !signature || !/^[0-9a-f]{64}$/i.test(signature) ||
    !date || !/^\d{8}T\d{6}Z$/.test(date) ||
    !credential || !credential.startsWith(config.accessKeyId + "/") ||
    !expires || !/^\d{1,2}$/.test(expires)
  ) return false;
  const scope = credential.slice(config.accessKeyId.length + 1);
  if (!/^\d{8}\/auto\/s3\/aws4_request$/.test(scope) ||
      scope.slice(0, 8) !== date.slice(0, 8)) return false;
  const seconds = Number(expires);
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 60) return false;

  const issued = Date.parse(
    date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6, 8) +
    "T" + date.slice(9, 11) + ":" + date.slice(11, 13) + ":" +
    date.slice(13, 15) + "Z",
  );
  const current = now.getTime();
  // Require a presently valid one-minute grant, permitting only a small
  // forward clock skew. Expired and future-dated grants never cause a fetch.
  return Number.isFinite(issued) && Number.isFinite(current) &&
    issued <= current + 15_000 && current < issued + seconds * 1_000;
}
