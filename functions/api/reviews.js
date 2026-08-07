import { json, errorJson, uid } from "../_shared/auth.js";

function rowToReview(row) {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    text: row.text,
    source: row.source,
    createdAt: row.created_at
  };
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM reviews ORDER BY created_at DESC").all();
  return json(results.map(rowToReview));
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || "").toString().slice(0, 80);
  const text = (body.text || "").toString().slice(0, 1000);
  const rating = Number(body.rating);

  if (!name || !text || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return errorJson("name, rating (1-5), and text are required");
  }

  const id = uid();
  const createdAt = new Date().toISOString();
  await env.DB.prepare("INSERT INTO reviews (id, name, rating, text, source, created_at) VALUES (?, ?, ?, ?, 'customer', ?)")
    .bind(id, name, rating, text, createdAt)
    .run();

  return json({ id, name, rating, text, source: "customer", createdAt }, { status: 201 });
}
