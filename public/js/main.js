// Shared chrome: nav scroll state, mobile menu, scroll-reveal animations, footer year/settings.
(function () {
  const nav = document.querySelector(".site-nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));
  }

  // Highlight current page in nav
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[href]").forEach((a) => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });

  // Scroll-reveal via IntersectionObserver (transform/opacity only, respects reduced motion)
  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && targets.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add("in"));
  }

  // Pull live settings (cafe name, contact info, colors) into the page
  if (window.Api) {
    Api.get("/api/settings")
      .then((s) => applySettings(s))
      .catch(() => {});
  }

  function applySettings(s) {
    if (!s) return;
    if (s.colors) {
      const root = document.documentElement.style;
      const map = {
        bg: "--bg", surface: "--surface", text: "--text", primary: "--primary",
        accent: "--accent", accent2: "--accent2", highlight: "--highlight"
      };
      Object.entries(map).forEach(([k, cssVar]) => {
        if (s.colors[k]) root.setProperty(cssVar, s.colors[k]);
      });
    }
    document.querySelectorAll("[data-cafe-name]").forEach((el) => (el.textContent = s.cafeName));
    document.querySelectorAll("[data-tagline]").forEach((el) => (el.textContent = s.tagline));
    document.querySelectorAll("[data-headline]").forEach((el) => (el.textContent = s.headline));
    document.querySelectorAll("[data-story-headline]").forEach((el) => (el.textContent = s.storyHeadline));
    document.querySelectorAll("[data-story-image]").forEach((el) => {
      if (s.storyImage) {
        el.src = s.storyImage;
        el.style.display = "block";
      }
    });
    document.querySelectorAll("[data-hero-text]").forEach((el) => (el.textContent = s.heroText));
    document.querySelectorAll("[data-about-text]").forEach((el) => (el.textContent = s.aboutText));
    document.querySelectorAll("[data-phone]").forEach((el) => (el.textContent = s.phone));
    document.querySelectorAll("[data-phone-href]").forEach((el) => (el.href = "tel:" + (s.phone || "").replace(/[^\d+]/g, "")));
    document.querySelectorAll("[data-address]").forEach((el) => (el.textContent = s.address));
    document.querySelectorAll("[data-email]").forEach((el) => (el.textContent = s.email));
    document.querySelectorAll("[data-maps-url]").forEach((el) => (el.href = s.mapsUrl || "#"));
    document.querySelectorAll("[data-rating]").forEach((el) => (el.textContent = s.rating));
    document.querySelectorAll("[data-review-count]").forEach((el) => (el.textContent = s.reviewCount));
    document.querySelectorAll("[data-price-range]").forEach((el) => (el.textContent = s.priceRange));
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

    const hoursBody = document.querySelector("[data-hours-body]");
    if (hoursBody && Array.isArray(s.hours)) {
      hoursBody.innerHTML = s.hours
        .map((h) => `<tr><td>${h.day}</td><td>${h.open} - ${h.close}</td></tr>`)
        .join("");
    }
    const hoursNote = document.querySelector("[data-hours-note]");
    if (hoursNote && s.hoursNote) hoursNote.textContent = s.hoursNote;

    const todayEl = document.querySelector("[data-hours-today]");
    if (todayEl && Array.isArray(s.hours)) {
      const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const today = s.hours.find((h) => h.day === dayName);
      todayEl.textContent = today ? `Open today until ${today.close}` : "";
    }
  }

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();

function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2600);
}
