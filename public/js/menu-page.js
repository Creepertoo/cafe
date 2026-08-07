// Menu page: group live menu items by category, filter chips, link to order page.
(function () {
  const list = document.querySelector("[data-menu-list]");
  const chipRow = document.querySelector("[data-menu-filters]");
  if (!list) return;

  let allItems = [];

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  function render(filter) {
    const cats = [...new Set(allItems.map((i) => i.category))];
    const catsToShow = filter && filter !== "all" ? [filter] : cats;
    list.innerHTML = catsToShow
      .map((cat) => {
        const items = allItems.filter((i) => i.category === cat && i.available);
        if (!items.length) return "";
        return `
        <div class="menu-cat reveal">
          <h2>${escapeHtml(cat)}</h2>
          <div class="menu-items">
            ${items
              .map(
                (m) => `
              <div class="menu-item">
                <div class="menu-item-thumb" ${m.image ? `style="background-image:url('${m.image}')"` : ""}></div>
                <div class="menu-item-body">
                  <div class="menu-item-top">
                    <h4>${escapeHtml(m.name)}${m.featured ? '<span class="badge-featured">Popular</span>' : ""}</h4>
                    <span class="price">$${m.price.toFixed(2)}</span>
                  </div>
                  <p>${escapeHtml(m.description || "")}</p>
                  <a class="menu-item-add" href="order.html">Order this &rarr;</a>
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
      })
      .join("");
    list.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  Api.get("/api/menu")
    .then((menu) => {
      allItems = menu;
      const cats = [...new Set(menu.map((i) => i.category))];
      if (chipRow) {
        chipRow.innerHTML =
          `<button class="chip active" data-filter="all">All</button>` +
          cats.map((c) => `<button class="chip" data-filter="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
        chipRow.querySelectorAll(".chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            chipRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            render(chip.getAttribute("data-filter"));
          });
        });
      }
      render("all");
    })
    .catch(() => {
      list.innerHTML = `<p>Menu is temporarily unavailable. Please call us instead.</p>`;
    });
})();
