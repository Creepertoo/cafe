import { json, errorJson, requireAdmin } from "../../_shared/auth.js";

function rowToItem(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image,
    available: !!row.available,
    featured: !!row.featured
  };
}

export async function onRequestPut({ request, env, params }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const current = await env.DB.prepare("SELECT * FROM menu_items WHERE id = ?").bind(params.id).first();
  if (!current) return errorJson("Not found", 404);

  const body = await request.json().catch(() => ({}));
  const merged = {
    category: body.category ?? current.category,
    name: body.name ?? current.name,
    description: body.description ?? current.description,
    price: body.price !== undefined ? Number(body.price) : current.price,
    image: body.image ?? current.image,
    available: body.available !== undefined ? (body.available ? 1 : 0) : current.available,
    featured: body.featured !== undefined ? (body.featured ? 1 : 0) : current.featured
  };

  await env.DB.prepare(
    "UPDATE menu_items SET category=?, name=?, description=?, price=?, image=?, available=?, featured=? WHERE id=?"
  )
    .bind(merged.category, merged.name, merged.description, merged.price, merged.image, merged.available, merged.featured, params.id)
    .run();

  const updated = await env.DB.prepare("SELECT * FROM menu_items WHERE id = ?").bind(params.id).first();
  return json(rowToItem(updated));
}

export async function onRequestDelete({ request, env, params }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const current = await env.DB.prepare("SELECT id FROM menu_items WHERE id = ?").bind(params.id).first();
  if (!current) return errorJson("Not found", 404);

  await env.DB.prepare("DELETE FROM menu_items WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
