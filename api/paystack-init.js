import { PLANS, getUser, send } from "./_lib.js";

// Step 1 of paying: the SERVER starts the Paystack transaction, so the price can't be changed by the student.
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const user = await getUser(req);
  if (!user) return send(res, 401, { error: "Please sign in first." });

  const planId = req.body && req.body.plan;
  const plan = PLANS[planId];
  if (!plan) return send(res, 400, { error: "Unknown plan." });

  const r = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: plan.amount,
      currency: "NGN",
      callback_url: process.env.APP_URL,
      metadata: { user_id: user.id, plan: planId },
    }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || !j.status) return send(res, 502, { error: "Could not start payment. Try again." });
  return send(res, 200, { authorization_url: j.data.authorization_url, reference: j.data.reference });
}
