import { json, isAdminRequest } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const isAdmin = await isAdminRequest(request, env.SESSION_SECRET || "dev-secret");
  return json({ isAdmin });
}
