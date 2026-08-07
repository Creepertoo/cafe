import { json, errorJson, requireAdmin } from "../../_shared/auth.js";

export async function onRequestPut({ request, env, params }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const current = await env.DB.prepare("SELECT id FROM orders WHERE id = ?").bind(params.id).first();
  if (!current) return errorJson("Not found", 404);

  const body = await request.json().catch(() => ({}));
  if (body.status) {
    await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(body.status, params.id).run();
  }

  const updated = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(params.id).first();
  return json({
    id: updated.id,
    items: JSON.parse(updated.items),
    customerName: updated.customer_name,
    phone: updated.phone,
    pickupTime: updated.pickup_time,
    notes: updated.notes,
    total: updated.total,
    status: updated.status,
    createdAt: updated.created_at
  });
}
