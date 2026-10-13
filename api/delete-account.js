import { getUser, send, adminHeaders } from "./_lib.js";

// Lets a signed-in student permanently delete their own account.
// Removing the login also removes their scores, subscription row and AI usage (the database tables are set to cascade).
// Payment records stay, but without the student's identity (see supabase/schema.sql), so disputes and accounting still work.
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const user = await getUser(req);
  if (!user) return send(res, 401, { error: "Please sign in first." });
  if (!req.body || req.body.confirm !== "DELETE") return send(res, 400, { error: "Confirmation missing." });

  const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!r.ok) return send(res, 502, { error: "Could not delete the account. Try again, or contact support." });
  return send(res, 200, { deleted: true });
}
