import { json, errorJson, requireAdmin, uid } from "../_shared/auth.js";

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

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM menu_items ORDER BY sort_order ASC, name ASC").all();
  return json(results.map(rowToItem));
}

export async function onRequestPost({ request, env }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.category || body.price === undefined) {
    return errorJson("name, category, and price are required");
  }

  const id = uid();
  await env.DB.prepare(
    "INSERT INTO menu_items (id, category, name, description, price, image, available, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id,
      body.category,
      body.name,
      body.description || "",
      Number(body.price),
      body.image || "",
      body.available === false ? 0 : 1,
      body.featured ? 1 : 0,
      999
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM menu_items WHERE id = ?").bind(id).first();
  return json(rowToItem(row), { status: 201 });
}
