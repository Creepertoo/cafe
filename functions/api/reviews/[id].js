import { json, errorJson, requireAdmin } from "../../_shared/auth.js";

export async function onRequestDelete({ request, env, params }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const current = await env.DB.prepare("SELECT id FROM reviews WHERE id = ?").bind(params.id).first();
  if (!current) return errorJson("Not found", 404);

  await env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
