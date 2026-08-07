// Renders the review grid + summary, and wires the "leave a review" form.
// Used on index.html (teaser) and a dedicated reviews block on about.html.
(function () {
  const grid = document.querySelector("[data-review-grid]");
  const summaryScore = document.querySelector("[data-review-score]");
  const summaryStars = document.querySelector("[data-review-stars]");
  const summaryCount = document.querySelector("[data-review-summary-count]");
  const form = document.querySelector("[data-review-form]");
  const limit = grid ? Number(grid.getAttribute("data-limit") || 0) : 0;

  function stars(n) {
    const full = Math.round(n);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  function renderCard(r) {
    const div = document.createElement("div");
    div.className = "review-card reveal";
    div.innerHTML = `
      <div class="stars">${stars(r.rating)}</div>
      <blockquote>"${escapeHtml(r.text)}"</blockquote>
      <footer>${escapeHtml(r.name)}</footer>
    `;
    return div;
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  async function loadReviews() {
    if (!grid && !summaryScore) return;
    try {
      const reviews = await Api.get("/api/reviews");
      if (grid) {
        grid.innerHTML = "";
        const list = limit ? reviews.slice(0, limit) : reviews;
        list.forEach((r) => grid.appendChild(renderCard(r)));
        // newly injected .reveal nodes need the observer; simplest is to reveal them directly
        grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      }
      if (summaryCount) summaryCount.textContent = reviews.length;
    } catch (e) {
      console.warn("Could not load reviews", e);
    }
  }

  loadReviews();

  if (form) {
    const stars_ = form.querySelectorAll("[data-star]");
    const ratingInput = form.querySelector("[name=rating]");
    stars_.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = Number(btn.getAttribute("data-star"));
        ratingInput.value = val;
        stars_.forEach((b) => b.classList.toggle("active", Number(b.getAttribute("data-star")) <= val));
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector("[data-form-msg]");
      const name = form.querySelector("[name=name]").value.trim();
      const text = form.querySelector("[name=text]").value.trim();
      const rating = Number(ratingInput.value || 0);

      if (!name || !text || !rating) {
        msg.textContent = "Please add your name, a rating, and a few words.";
        msg.className = "form-msg err";
        return;
      }
      try {
        await Api.post("/api/reviews", { name, text, rating });
        msg.textContent = "Thanks! Your review is live.";
        msg.className = "form-msg ok";
        form.reset();
        stars_.forEach((b) => b.classList.remove("active"));
        loadReviews();
      } catch (err) {
        msg.textContent = err.message || "Something went wrong, please try again.";
        msg.className = "form-msg err";
      }
    });
  }
})();
