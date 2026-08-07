import { json, errorJson, hashPassword, verifyPassword, createSessionCookie } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const password = body.password;
  if (!password) return errorJson("Password required");

  let row = await env.DB.prepare("SELECT * FROM admin WHERE id = 1").first();

  if (!row || !row.password_hash) {
    const hash = await hashPassword(env.ADMIN_PASSWORD || "changeme123", env.SESSION_SECRET || "dev-secret");
    await env.DB.prepare("INSERT INTO admin (id, password_hash) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash")
      .bind(hash)
      .run();
    row = { password_hash: hash };
  }

  const ok = await verifyPassword(password, env.SESSION_SECRET || "dev-secret", row.password_hash);
  if (!ok) return errorJson("Incorrect password", 401);

  const cookie = await createSessionCookie(env.SESSION_SECRET || "dev-secret");
  return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
