import crypto from "node:crypto";
import { paystackVerify, checkTransaction, grantPremium } from "./_lib.js";

// Backup path: Paystack calls this itself, even if the student closes the app before returning.
// Set the webhook URL in Paystack dashboard: https://YOUR-SITE/api/paystack-webhook
export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const raw = await rawBody(req);
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(raw).digest("hex");
  const given = String(req.headers["x-paystack-signature"] || "");
  const ok = given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return res.status(401).end();

  try {
    const event = JSON.parse(raw.toString("utf8"));
    if (event.event === "charge.success" && event.data && event.data.reference) {
      // Don't trust the webhook body alone: ask Paystack again.
      const info = checkTransaction(await paystackVerify(event.data.reference));
      if (info) await grantPremium(info);
    }
  } catch (e) {
    // Return 200 anyway so Paystack doesn't retry forever; the verify route can still recover this payment.
  }
  return res.status(200).end();
}
