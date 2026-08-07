import { json, clearSessionCookie } from "../../_shared/auth.js";

export async function onRequestPost() {
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
