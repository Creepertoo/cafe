// Homepage: render featured dishes pulled live from the menu API.
(function () {
  const grid = document.querySelector("[data-featured-grid]");
  if (!grid) return;

  Api.get("/api/menu")
    .then((menu) => {
      const featured = menu.filter((m) => m.featured && m.available).slice(0, 3);
      const items = featured.length ? featured : menu.slice(0, 3);
      grid.innerHTML = items
        .map(
          (m) => `
        <article class="dish-card">
          <div class="dish-thumb" ${m.image ? `style="background-image:url('${m.image}');background-size:cover;background-position:center"` : ""}></div>
          <span class="dish-tag">${escapeHtml(m.category)}</span>
          <h3>${escapeHtml(m.name)}</h3>
          <p>${escapeHtml(m.description || "")}</p>
          <div class="price">$${m.price.toFixed(2)}</div>
        </article>`
        )
        .join("");
      grid.querySelectorAll(".dish-card").forEach((el, i) => {
        el.classList.add("reveal");
        setTimeout(() => el.classList.add("in"), 60 * i);
      });
    })
    .catch(() => {});

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }
})();
