// Single Worker entry point for the "Workers with static assets" deploy
// path (what `npx wrangler deploy` actually builds). /api/* and /uploads/*
// are routed to the same handler functions used by the Pages-Functions
// layout under /functions (imported directly, not duplicated), everything
// else falls through to the static files in /public via the ASSETS binding.

import * as menuList from "../functions/api/menu.js";
import * as menuItem from "../functions/api/menu/[id].js";
import * as reviewsList from "../functions/api/reviews.js";
import * as reviewItem from "../functions/api/reviews/[id].js";
import * as settings from "../functions/api/settings.js";
import * as ordersList from "../functions/api/orders.js";
import * as orderItem from "../functions/api/orders/[id].js";
import * as adminLogin from "../functions/api/admin/login.js";
import * as adminLogout from "../functions/api/admin/logout.js";
import * as adminSession from "../functions/api/admin/session.js";
import * as adminChangePassword from "../functions/api/admin/change-password.js";
import * as upload from "../functions/api/upload.js";
import * as uploadsGet from "../functions/uploads/[filename].js";

const routes = [
  { method: "GET", path: "/api/menu", handler: menuList.onRequestGet },
  { method: "POST", path: "/api/menu", handler: menuList.onRequestPost },
  { method: "PUT", path: "/api/menu/:id", handler: menuItem.onRequestPut },
  { method: "DELETE", path: "/api/menu/:id", handler: menuItem.onRequestDelete },
  { method: "GET", path: "/api/reviews", handler: reviewsList.onRequestGet },
  { method: "POST", path: "/api/reviews", handler: reviewsList.onRequestPost },
  { method: "DELETE", path: "/api/reviews/:id", handler: reviewItem.onRequestDelete },
  { method: "GET", path: "/api/settings", handler: settings.onRequestGet },
  { method: "PUT", path: "/api/settings", handler: settings.onRequestPut },
  { method: "GET", path: "/api/orders", handler: ordersList.onRequestGet },
  { method: "POST", path: "/api/orders", handler: ordersList.onRequestPost },
  { method: "PUT", path: "/api/orders/:id", handler: orderItem.onRequestPut },
  { method: "POST", path: "/api/admin/login", handler: adminLogin.onRequestPost },
  { method: "POST", path: "/api/admin/logout", handler: adminLogout.onRequestPost },
  { method: "GET", path: "/api/admin/session", handler: adminSession.onRequestGet },
  { method: "POST", path: "/api/admin/change-password", handler: adminChangePassword.onRequestPost },
  { method: "POST", path: "/api/upload", handler: upload.onRequestPost },
  { method: "GET", path: "/uploads/:filename", handler: uploadsGet.onRequestGet }
];

function matchRoute(method, pathname) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const paramNames = [];
    const regexStr =
      "^" +
      route.path.replace(/:[^/]+/g, (m) => {
        paramNames.push(m.slice(1));
        return "([^/]+)";
      }) +
      "$";
    const match = pathname.match(new RegExp(regexStr));
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
      return { handler: route.handler, params };
    }
  }
  return null;
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status: status || 500,
    headers: { "Content-Type": "application/json" }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/") || pathname.startsWith("/uploads/")) {
      const matched = matchRoute(request.method, pathname);
      if (!matched) return jsonError("Not found", 404);

      try {
        return await matched.handler({
          request,
          env,
          params: matched.params,
          waitUntil: ctx.waitUntil.bind(ctx)
        });
      } catch (err) {
        return jsonError("Server error: " + err.message, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
