import Api from "../ApiMethod";

export async function getMemberships() {
  return Api.get("/api/v1/auth/memberships");
}

export async function switchOrg(targetKey) {
  return Api.post("/api/v1/auth/switch", { targetKey });
}

export async function switchOrgToken(targetKey) {
  return Api.post("/api/v1/auth/switch-token", { targetKey });
}
