import { getUser, send, paystackVerify, checkTransaction, grantPremium } from "./_lib.js";

// Step 2: after Paystack sends the student back, the app calls this with the payment reference.
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const user = await getUser(req);
  if (!user) return send(res, 401, { error: "Please sign in first." });

  const reference = String((req.body && req.body.reference) || "").slice(0, 100);
  if (!reference) return send(res, 400, { error: "Missing payment reference." });

  const tx = await paystackVerify(reference);
  const info = checkTransaction(tx);
  if (!info || info.userId !== user.id) {
    return send(res, 400, { error: "We could not confirm this payment. If you were charged, contact support." });
  }
  try {
    const result = await grantPremium(info);
    return send(res, 200, { premium_until: result.premium_until });
  } catch (e) {
    return send(res, 500, { error: "Payment confirmed but we could not activate Premium. Contact support." });
  }
}
