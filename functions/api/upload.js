import { json, errorJson, requireAdmin } from "../_shared/auth.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const EXT_BY_TYPE = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };
const MAX_BYTES = 8 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  if (!env.STORAGE) {
    return errorJson("Photo storage is not configured yet. Bind an R2 bucket named STORAGE to this Pages project.", 500);
  }

  const form = await request.formData().catch(() => null);
  const file = form ? form.get("photo") : null;
  if (!file || typeof file === "string") {
    return errorJson("No file uploaded");
  }
  if (!ALLOWED.has(file.type)) {
    return errorJson("Unsupported file type");
  }
  if (file.size > MAX_BYTES) {
    return errorJson("File too large (8MB max)");
  }

  const ext = EXT_BY_TYPE[file.type] || "bin";
  const key = `${crypto.randomUUID()}.${ext}`;

  await env.STORAGE.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });

  return json({ url: `/uploads/${key}` }, { status: 201 });
}
