import { verifyAiGradingAccess } from "@/utils/apiAuth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  // BE-0188: the backend verifies the session; only staff learn whether the paid key is configured.
  const access = await verifyAiGradingAccess(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  return res.status(200).json({
    ok: true,
    has_api_key: !!process.env.OPENAI_API_KEY,
    remaining_today: access.user?.remainingToday ?? null,
  });
}
