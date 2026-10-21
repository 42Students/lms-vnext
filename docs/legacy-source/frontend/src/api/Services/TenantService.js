import { API_URL } from "@/config/appConfig";

export async function getTenantBootstrap() {
  let res;
  try {
    res = await fetch(`${API_URL}/api/v1/public/tenant-bootstrap`, {
      method: "GET",
      credentials: "include",
    });
  } catch (networkError) {
    const err = new Error("TENANT_BOOTSTRAP_NETWORK_FAILED");
    err.code = "TENANT_BOOTSTRAP_NETWORK_FAILED";
    err.status = 0;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || "TENANT_BOOTSTRAP_FAILED");
    err.code = data?.error || "TENANT_BOOTSTRAP_FAILED";
    err.status = res.status;
    err.response = data;
    throw err;
  }
  return data;
}
