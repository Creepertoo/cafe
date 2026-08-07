import { json, errorJson, requireAdmin, uid } from "../_shared/auth.js";

function rowToOrder(row) {
  return {
    id: row.id,
    items: JSON.parse(row.items),
    customerName: row.customer_name,
    phone: row.phone,
    pickupTime: row.pickup_time,
    notes: row.notes,
    total: row.total,
    status: row.status,
    createdAt: row.created_at
  };
}

export async function onRequestGet({ request, env }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const { results } = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  return json(results.map(rowToOrder));
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const items = body.items;
  const customerName = (body.customerName || "").toString().slice(0, 120);
  const phone = (body.phone || "").toString().slice(0, 40);
  const pickupTime = body.pickupTime ? body.pickupTime.toString().slice(0, 60) : "As soon as possible";
  const notes = body.notes ? body.notes.toString().slice(0, 500) : "";

  if (!Array.isArray(items) || items.length === 0) {
    return errorJson("Your cart is empty");
  }
  if (!customerName || !phone) {
    return errorJson("Name and phone are required");
  }

  const lineItems = [];
  let total = 0;

  for (const reqItem of items) {
    const row = await env.DB.prepare("SELECT * FROM menu_items WHERE id = ?").bind(reqItem.menuId).first();
    if (!row || !row.available) {
      return errorJson(`Item unavailable: ${reqItem.menuId}`);
    }
    const qty = Math.max(1, Math.min(20, Number(reqItem.qty) || 1));
    total += row.price * qty;
    lineItems.push({ menuId: row.id, name: row.name, price: row.price, qty });
  }
  total = Math.round(total * 100) / 100;

  const id = uid();
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO orders (id, items, customer_name, phone, pickup_time, notes, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)"
  )
    .bind(id, JSON.stringify(lineItems), customerName, phone, pickupTime, notes, total, createdAt)
    .run();

  const order = { id, items: lineItems, customerName, phone, pickupTime, notes, total, status: "new", createdAt };

  // Fire-and-forget the notification email so a slow/broken email provider
  // never blocks the customer's order from completing.
  try {
    await sendOrderEmail(env, order);
  } catch (e) {
    // Order is already saved and visible in the admin panel either way.
  }

  return json(order, { status: 201 });
}

async function sendOrderEmail(env, order) {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL) return;

  const lines = order.items.map((i) => `  ${i.qty} x ${i.name} - $${(i.qty * i.price).toFixed(2)}`).join("\n");
  const text =
    `A new order came in through the website.\n\n` +
    `Customer: ${order.customerName}\n` +
    `Phone: ${order.phone}\n` +
    `Pickup time: ${order.pickupTime}\n` +
    (order.notes ? `Notes: ${order.notes}\n` : "") +
    `\nItems:\n${lines}\n\nTotal: $${order.total.toFixed(2)}\n\n` +
    `Payment is collected in person / by phone, this order was not paid online.`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || "orders@resend.dev",
      to: env.ADMIN_EMAIL,
      subject: `New order from ${order.customerName} - $${order.total.toFixed(2)}`,
      text
    })
  });
}
