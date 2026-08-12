// Thin wrapper around the Cloudflare Pages Functions API (see /functions/api/*).
// Same-origin, so no base URL needed.
const Api = {
  async get(path) {
    const res = await fetch(path, { credentials: "include" });
    if (!res.ok) throw await Api._err(res);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw await Api._err(res);
    return res.json();
  },
  async put(path, body) {
    const res = await fetch(path, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw await Api._err(res);
    return res.json();
  },
  async del(path) {
    const res = await fetch(path, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw await Api._err(res);
    return res.json();
  },
  async upload(path, file) {
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch(path, { method: "POST", credentials: "include", body: fd });
    if (!res.ok) throw await Api._err(res);
    return res.json();
  },
  async _err(res) {
    try {
      const data = await res.json();
      return new Error(data.error || `Request failed (${res.status})`);
    } catch {
      return new Error(`Request failed (${res.status})`);
    }
  }
};

// Explicitly expose on window: a top-level `const` does NOT become a
// `window.X` property in a classic (non-module) script, so other scripts
// checking `if (window.Api)` would otherwise always see it as missing.
window.Api = Api;
