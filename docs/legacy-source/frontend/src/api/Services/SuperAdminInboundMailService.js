import Api from "../ApiMethod";

// Super Admin > Inbound mail: every email sent to a 42lms.com address (Cloudflare Email Routing -> worker -> backend).
// Backend: SuperAdminInboundMailController.

/** params: { show: OPEN | REPLIES | DONE | ALL, q, page } */
export const listInboundMail = (params = {}) => Api.get("/api/v1/superadmin/inbound-mail", { params });

export const getInboundMail = (id) => Api.get(`/api/v1/superadmin/inbound-mail/${id}`);

export const markInboundMailDone = (id, done = true) => Api.post(`/api/v1/superadmin/inbound-mail/${id}/done`, null, { params: { done } });
