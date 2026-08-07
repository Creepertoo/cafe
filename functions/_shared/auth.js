// Auth helpers for Cloudflare Pages Functions.
// No external dependencies: password hashing and session cookies are built
// entirely on the Web Crypto API that ships with the Workers runtime.

const COOKIE_NAME = "upc_session";
const SESSION_HOURS = 8;

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToBuf(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

/**
 * Hash a password with PBKDF2. The salt is derived from SESSION_SECRET so no
 * separate salt storage is needed; this is a reasonable tradeoff for a small
 * single-admin site (never reuse this pattern for a multi-user system).
 */
export async function hashPassword(password, secret) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const salt = enc.encode("upc-salt::" + secret);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  return bufToBase64(bits);
}

export async function verifyPassword(password, secret, storedHash) {
  const candidate = await hashPassword(password, secret);
  return candidate === storedHash;
}

async function hmacKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSessionCookie(secret) {
  const payload = JSON.stringify({ admin: true, exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 });
  const payloadB64 = btoa(payload);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = bufToBase64(sig);
  const value = `${payloadB64}.${sigB64}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.split(/;\s*/).find((c) => c.startsWith(name + "="));
  return match ? match.slice(name.length + 1) : null;
}

export async function isAdminRequest(request, secret) {
  const raw = getCookie(request, COOKIE_NAME);
  if (!raw) return false;
  const [payloadB64, sigB64] = raw.split(".");
  if (!payloadB64 || !sigB64) return false;
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, base64ToBuf(sigB64), new TextEncoder().encode(payloadB64));
    if (!valid) return false;
    const payload = JSON.parse(atob(payloadB64));
    return payload.admin === true && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init && init.headers) }
  });
}

export function errorJson(message, status) {
  return json({ error: message }, { status: status || 400 });
}

export async function requireAdmin(request, env) {
  const ok = await isAdminRequest(request, env.SESSION_SECRET);
  if (!ok) return errorJson("Not authenticated", 401);
  return null;
}

export function uid() {
  return crypto.randomUUID();
}
