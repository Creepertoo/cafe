import { json, errorJson, requireAdmin } from "../_shared/auth.js";

function rowToSettings(row) {
  return {
    cafeName: row.cafe_name,
    tagline: row.tagline,
    headline: row.headline,
    heroText: row.hero_text,
    aboutText: row.about_text,
    storyHeadline: row.story_headline,
    storyImage: row.story_image,
    phone: row.phone,
    email: row.email,
    address: row.address,
    mapsUrl: row.maps_url,
    priceRange: row.price_range,
    rating: row.rating,
    reviewCount: row.review_count,
    colors: JSON.parse(row.colors_json || "{}"),
    hours: JSON.parse(row.hours_json || "[]"),
    hoursNote: row.hours_note
  };
}

export async function onRequestGet({ env }) {
  const row = await env.DB.prepare("SELECT * FROM settings WHERE id = 1").first();
  if (!row) return errorJson("Settings not found", 404);
  return json(rowToSettings(row));
}

export async function onRequestPut({ request, env }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const current = await env.DB.prepare("SELECT * FROM settings WHERE id = 1").first();
  if (!current) return errorJson("Settings not found", 404);

  const merged = {
    cafe_name: body.cafeName ?? current.cafe_name,
    tagline: body.tagline ?? current.tagline,
    headline: body.headline ?? current.headline,
    hero_text: body.heroText ?? current.hero_text,
    about_text: body.aboutText ?? current.about_text,
    story_headline: body.storyHeadline ?? current.story_headline,
    story_image: body.storyImage ?? current.story_image,
    phone: body.phone ?? current.phone,
    email: body.email ?? current.email,
    address: body.address ?? current.address,
    maps_url: body.mapsUrl ?? current.maps_url,
    price_range: body.priceRange ?? current.price_range,
    rating: body.rating ?? current.rating,
    review_count: body.reviewCount ?? current.review_count,
    colors_json: body.colors ? JSON.stringify({ ...JSON.parse(current.colors_json || "{}"), ...body.colors }) : current.colors_json,
    hours_json: body.hours ? JSON.stringify(body.hours) : current.hours_json,
    hours_note: body.hoursNote ?? current.hours_note
  };

  await env.DB.prepare(
    `UPDATE settings SET cafe_name=?, tagline=?, headline=?, hero_text=?, about_text=?, story_headline=?, story_image=?, phone=?, email=?, address=?, maps_url=?, price_range=?, rating=?, review_count=?, colors_json=?, hours_json=?, hours_note=? WHERE id=1`
  )
    .bind(
      merged.cafe_name, merged.tagline, merged.headline, merged.hero_text, merged.about_text,
      merged.story_headline, merged.story_image, merged.phone, merged.email,
      merged.address, merged.maps_url, merged.price_range, merged.rating, merged.review_count,
      merged.colors_json, merged.hours_json, merged.hours_note
    )
    .run();

  const updated = await env.DB.prepare("SELECT * FROM settings WHERE id = 1").first();
  return json(rowToSettings(updated));
}
