import { json, errorJson, requireAdmin, hashPassword } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const newPassword = body.newPassword;
  if (!newPassword || newPassword.length < 6) {
    return errorJson("Password must be at least 6 characters");
  }

  const hash = await hashPassword(newPassword, env.SESSION_SECRET || "dev-secret");
  await env.DB.prepare("INSERT INTO admin (id, password_hash) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash")
    .bind(hash)
    .run();

  return json({ ok: true });
}
