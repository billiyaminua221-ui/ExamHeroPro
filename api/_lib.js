// Shared server helpers. Files starting with "_" are NOT exposed as public URLs by Vercel.

// Server is the source of truth for prices (amount in kobo: 100 kobo = ₦1).
// If you change these, change the display prices in src/App.jsx (PLANS) too.
export const PLANS = {
  monthly: { amount: 150000, days: 30 }, // ₦1,500
  term: { amount: 350000, days: 90 },    // ₦3,500
};

const SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYSTACK = process.env.PAYSTACK_SECRET_KEY;

export const send = (res, status, body) => res.status(status).json(body);

// Confirms the student's login token with Supabase and returns { id, email }.
export async function getUser(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token || !SB || !SERVICE) return null;
  const r = await fetch(`${SB}/auth/v1/user`, {
    headers: { apikey: SERVICE, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? { id: u.id, email: u.email } : null;
}

// Headers for server-only calls. New Supabase "secret" keys (sb_secret_...) must go in the apikey header only;
// the older service_role key (a long JWT) is also sent as a bearer token.
export function adminHeaders(extra = {}) {
  const h = { apikey: SERVICE, "Content-Type": "application/json", ...extra };
  if (!String(SERVICE).startsWith("sb_")) h.Authorization = `Bearer ${SERVICE}`;
  return h;
}

// Database access with the server key (bypasses row-level security: server only!).
export function admin(path, opts = {}) {
  return fetch(`${SB}/rest/v1/${path}`, { ...opts, headers: adminHeaders(opts.headers || {}) });
}

export async function getPremiumUntil(userId) {
  const r = await admin(`subscriptions?select=premium_until&user_id=eq.${userId}`);
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0] ? rows[0].premium_until : null;
}

export async function isPremium(userId) {
  const until = await getPremiumUntil(userId);
  return !!until && new Date(until) > new Date();
}

// Asks Paystack directly whether a payment really happened.
export async function paystackVerify(reference) {
  const r = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${PAYSTACK}` } }
  );
  const j = await r.json().catch(() => null);
  return r.ok && j && j.status ? j.data : null;
}

// Accepts a payment only if it succeeded, is in naira, and matches a real plan price exactly.
export function checkTransaction(tx) {
  if (!tx || tx.status !== "success" || tx.currency !== "NGN") return null;
  const meta = tx.metadata || {};
  const plan = PLANS[meta.plan];
  if (!plan || !meta.user_id || tx.amount !== plan.amount) return null;
  return { userId: meta.user_id, plan: meta.plan, amount: tx.amount, reference: tx.reference };
}

// Adds Premium time. Safe to call twice for the same payment (the second call changes nothing).
export async function grantPremium({ userId, plan, reference, amount }) {
  const p = PLANS[plan];
  if (!p) throw new Error("Unknown plan");

  const ins = await admin("payments", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ reference, user_id: userId, plan, amount }),
  });
  if (ins.status === 409) return { already: true, premium_until: await getPremiumUntil(userId) };
  if (!ins.ok) throw new Error("Could not record payment");

  try {
    const current = await getPremiumUntil(userId);
    const start = current && new Date(current) > new Date() ? new Date(current) : new Date();
    const until = new Date(start.getTime() + p.days * 86400000).toISOString();
    const up = await admin("subscriptions?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: userId, premium_until: until, updated_at: new Date().toISOString() }),
    });
    if (!up.ok) throw new Error("Could not update subscription");
    return { premium_until: until };
  } catch (e) {
    // Undo the payment record so the student can retry verification.
    await admin(`payments?reference=eq.${encodeURIComponent(reference)}`, { method: "DELETE" });
    throw e;
  }
}
