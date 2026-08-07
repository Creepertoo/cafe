(function () {
  const loginScreen = document.getElementById("login-screen");
  const shell = document.getElementById("admin-shell");
  const loginForm = document.getElementById("login-form");
  const loginMsg = document.getElementById("login-msg");

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  // ---------- Auth ----------
  async function checkSession() {
    try {
      const { isAdmin } = await Api.get("/api/admin/session");
      if (isAdmin) enterApp();
      else showLogin();
    } catch {
      showLogin();
    }
  }
  function showLogin() { loginScreen.style.display = "flex"; shell.style.display = "none"; }
  function enterApp() {
    loginScreen.style.display = "none";
    shell.style.display = "grid";
    loadMenu(); loadOrders(); loadReviews(); loadSettingsIntoForms();
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = loginForm.password.value;
    try {
      await Api.post("/api/admin/login", { password });
      loginForm.reset();
      loginMsg.textContent = "";
      enterApp();
    } catch (err) {
      loginMsg.textContent = err.message || "Login failed";
    }
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await Api.post("/api/admin/logout", {});
    showLogin();
  });

  // ---------- Tabs ----------
  document.querySelectorAll(".admin-side .tab[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-side .tab[data-tab]").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
    });
  });

  // ---------- Menu ----------
  async function loadMenu() {
    const items = await Api.get("/api/menu");
    const body = document.getElementById("menu-table-body");
    body.innerHTML = items
      .map(
        (m) => `
      <tr data-id="${m.id}">
        <td><input class="edit-name" value="${escapeHtml(m.name)}" style="border:none;background:none;font-weight:600;width:140px;"></td>
        <td><input class="edit-category" value="${escapeHtml(m.category)}" style="border:none;background:none;width:150px;"></td>
        <td><input class="edit-price" type="number" step="0.01" value="${m.price}" style="border:none;background:none;width:70px;"></td>
        <td><input class="edit-available" type="checkbox" ${m.available ? "checked" : ""}></td>
        <td class="row-actions">
          <button class="save-item">Save</button>
          <button class="danger delete-item">Delete</button>
        </td>
      </tr>`
      )
      .join("");

    body.querySelectorAll("tr").forEach((row) => {
      const id = row.getAttribute("data-id");
      row.querySelector(".save-item").addEventListener("click", async () => {
        await Api.put(`/api/menu/${id}`, {
          name: row.querySelector(".edit-name").value,
          category: row.querySelector(".edit-category").value,
          price: Number(row.querySelector(".edit-price").value),
          available: row.querySelector(".edit-available").checked
        });
        showSaved(row.querySelector(".save-item"));
      });
      row.querySelector(".delete-item").addEventListener("click", async () => {
        if (!confirm("Delete this menu item?")) return;
        await Api.del(`/api/menu/${id}`);
        loadMenu();
      });
    });
  }

  function showSaved(btn) {
    const old = btn.textContent;
    btn.textContent = "Saved";
    setTimeout(() => (btn.textContent = old), 1200);
  }

  document.getElementById("menu-add-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    let image = "";
    const file = form.querySelector("[name=photo]").files[0];
    if (file) {
      const up = await Api.upload("/api/upload", file);
      image = up.url;
    }
    await Api.post("/api/menu", {
      name: fd.get("name"),
      category: fd.get("category"),
      price: Number(fd.get("price")),
      description: fd.get("description"),
      featured: fd.get("featured") === "true",
      image
    });
    form.reset();
    loadMenu();
  });

  // ---------- Orders ----------
  async function loadOrders() {
    const orders = await Api.get("/api/orders");
    const body = document.getElementById("orders-table-body");
    if (!orders.length) {
      body.innerHTML = `<tr><td colspan="5" style="color:var(--text-soft);">No orders yet.</td></tr>`;
      return;
    }
    body.innerHTML = orders
      .map(
        (o) => `
      <tr data-id="${o.id}">
        <td>${new Date(o.createdAt).toLocaleString()}</td>
        <td>${escapeHtml(o.customerName)}<br><span style="color:var(--text-soft);font-size:.8rem;">${escapeHtml(o.phone)}</span></td>
        <td>${o.items.map((i) => `${i.qty}&times; ${escapeHtml(i.name)}`).join("<br>")}</td>
        <td>$${o.total.toFixed(2)}</td>
        <td>
          <select class="status-select">
            ${["pending_payment", "paid", "preparing", "ready", "completed", "cancelled"]
              .map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s.replace("_", " ")}</option>`)
              .join("")}
          </select>
        </td>
      </tr>`
      )
      .join("");

    body.querySelectorAll("tr").forEach((row) => {
      const id = row.getAttribute("data-id");
      row.querySelector(".status-select").addEventListener("change", async (e) => {
        await Api.put(`/api/orders/${id}`, { status: e.target.value });
      });
    });
  }

  // ---------- Reviews ----------
  async function loadReviews() {
    const reviews = await Api.get("/api/reviews");
    const body = document.getElementById("reviews-table-body");
    body.innerHTML = reviews
      .map(
        (r) => `
      <tr data-id="${r.id}">
        <td>${escapeHtml(r.name)}</td>
        <td>${"★".repeat(r.rating)}</td>
        <td style="max-width:340px;">${escapeHtml(r.text)}</td>
        <td class="row-actions"><button class="danger delete-review">Delete</button></td>
      </tr>`
      )
      .join("");
    body.querySelectorAll(".delete-review").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.closest("tr").getAttribute("data-id");
        if (!confirm("Delete this review?")) return;
        await Api.del(`/api/reviews/${id}`);
        loadReviews();
      });
    });
  }

  // ---------- Settings: text / colors / contact / hours ----------
  let currentSettings = null;

  async function loadSettingsIntoForms() {
    currentSettings = await Api.get("/api/settings");
    const s = currentSettings;

    const cf = document.getElementById("content-form");
    cf.cafeName.value = s.cafeName || "";
    cf.tagline.value = s.tagline || "";
    cf.heroText.value = s.heroText || "";
    cf.aboutText.value = s.aboutText || "";

    const colf = document.getElementById("colors-form");
    Object.entries(s.colors || {}).forEach(([k, v]) => {
      if (colf[k]) colf[k].value = v;
    });

    const ctf = document.getElementById("contact-form");
    ["phone", "email", "address", "mapsUrl", "priceRange"].forEach((k) => {
      if (ctf[k]) ctf[k].value = s[k] || "";
    });

    document.getElementById("hours-hint").textContent = s.hoursNote || "";
    renderHoursEditor(s.hours || []);
  }

  document.getElementById("content-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await Api.put("/api/settings", {
      cafeName: fd.get("cafeName"),
      tagline: fd.get("tagline"),
      heroText: fd.get("heroText"),
      aboutText: fd.get("aboutText")
    });
    flashMsg("content-msg", "Saved.");
  });

  document.getElementById("colors-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const colors = { ...currentSettings.colors };
    ["bg", "text", "accent", "accent2", "highlight"].forEach((k) => (colors[k] = fd.get(k)));
    await Api.put("/api/settings", { colors });
    flashMsg("colors-msg", "Saved. Refresh the live site to see it.");
  });

  document.getElementById("contact-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await Api.put("/api/settings", {
      phone: fd.get("phone"),
      email: fd.get("email"),
      address: fd.get("address"),
      mapsUrl: fd.get("mapsUrl"),
      priceRange: fd.get("priceRange")
    });
    flashMsg("contact-msg", "Saved.");
  });

  function renderHoursEditor(hours) {
    const wrap = document.getElementById("hours-editor");
    wrap.innerHTML = hours
      .map(
        (h, i) => `
      <div class="admin-grid2" data-idx="${i}" style="align-items:end;">
        <div class="admin-field"><label>${escapeHtml(h.day)} open</label><input class="hr-open" value="${escapeHtml(h.open)}"></div>
        <div class="admin-field"><label>${escapeHtml(h.day)} close</label><input class="hr-close" value="${escapeHtml(h.close)}"></div>
      </div>`
      )
      .join("");
  }

  document.getElementById("save-hours-btn").addEventListener("click", async () => {
    const rows = document.querySelectorAll("#hours-editor > div");
    const hours = currentSettings.hours.map((h, i) => {
      const row = [...rows].find((r) => Number(r.getAttribute("data-idx")) === i);
      return { day: h.day, open: row.querySelector(".hr-open").value, close: row.querySelector(".hr-close").value };
    });
    await Api.put("/api/settings", { hours });
    flashMsg("hours-msg", "Saved.");
  });

  document.getElementById("password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = e.target.newPassword.value;
    try {
      await Api.post("/api/admin/change-password", { newPassword });
      e.target.reset();
      flashMsg("password-msg", "Password updated.");
    } catch (err) {
      flashMsg("password-msg", err.message, true);
    }
  });

  function flashMsg(id, text, isErr) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.style.color = isErr ? "var(--highlight)" : "var(--accent2)";
    setTimeout(() => (el.textContent = ""), 2600);
  }

  checkSession();
})();
