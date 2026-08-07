// Order page: browsable menu with add-to-cart, live cart panel, submits an
// order request (no online payment) and shows an inline confirmation.
(function () {
  const list = document.querySelector("[data-order-menu]");
  const cartPanel = document.querySelector("[data-cart-lines]");
  const cartTotal = document.querySelector("[data-cart-total]");
  const cartCountEls = document.querySelectorAll("[data-cart-count]");
  const checkoutBtn = document.querySelector("[data-checkout-btn]");
  const form = document.querySelector("[data-checkout-form]");
  const cartView = document.querySelector("[data-cart-view]");
  const cartSuccess = document.querySelector("[data-cart-success]");
  let allItems = [];

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  function renderMenu() {
    const cats = [...new Set(allItems.map((i) => i.category))];
    list.innerHTML = cats
      .map((cat) => {
        const items = allItems.filter((i) => i.category === cat && i.available);
        if (!items.length) return "";
        return `
        <div class="menu-cat">
          <h2>${escapeHtml(cat)}</h2>
          <div class="menu-items">
            ${items
              .map(
                (m) => `
              <div class="menu-item">
                <div class="menu-item-thumb" ${m.image ? `style="background-image:url('${m.image}')"` : ""}></div>
                <div class="menu-item-body">
                  <div class="menu-item-top">
                    <h4>${escapeHtml(m.name)}</h4>
                    <span class="price">$${Number(m.price).toFixed(2)}</span>
                  </div>
                  <p>${escapeHtml(m.description || "")}</p>
                  <button class="menu-item-add" data-add="${m.id}" data-name="${escapeHtml(m.name)}" data-price="${m.price}">+ Add to order</button>
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
      })
      .join("");

    list.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        Cart.add({ menuId: btn.getAttribute("data-add"), name: btn.getAttribute("data-name"), price: Number(btn.getAttribute("data-price")) });
        showToast(`Added ${btn.getAttribute("data-name")}`);
      });
    });
  }

  function renderCart() {
    const items = Cart.get();
    if (!items.length) {
      cartPanel.innerHTML = `<p class="cart-empty">Your order is empty. Add something delicious.</p>`;
    } else {
      cartPanel.innerHTML = items
        .map(
          (i) => `
        <div class="cart-line">
          <div>
            <div class="cart-line-name">${escapeHtml(i.name)}</div>
            <div class="cart-line-sub">$${Number(i.price).toFixed(2)} each</div>
          </div>
          <div class="qty-ctrl">
            <button type="button" data-dec="${i.menuId}">-</button>
            <span>${i.qty}</span>
            <button type="button" data-inc="${i.menuId}">+</button>
          </div>
        </div>`
        )
        .join("");
      cartPanel.querySelectorAll("[data-inc]").forEach((b) =>
        b.addEventListener("click", () => {
          const it = items.find((i) => i.menuId === b.getAttribute("data-inc"));
          Cart.setQty(it.menuId, it.qty + 1);
        })
      );
      cartPanel.querySelectorAll("[data-dec]").forEach((b) =>
        b.addEventListener("click", () => {
          const it = items.find((i) => i.menuId === b.getAttribute("data-dec"));
          Cart.setQty(it.menuId, it.qty - 1);
        })
      );
    }
    cartTotal.textContent = "$" + Cart.total().toFixed(2);
    cartCountEls.forEach((el) => (el.textContent = Cart.count()));
    if (checkoutBtn) checkoutBtn.disabled = items.length === 0;
  }

  window.addEventListener("cart:change", renderCart);

  Api.get("/api/menu")
    .then((menu) => {
      allItems = menu;
      renderMenu();
      renderCart();
    })
    .catch(() => {
      list.innerHTML = `<p>Menu is temporarily unavailable. Please call us to order.</p>`;
    });

  function showSuccess(order) {
    cartView.style.display = "none";
    cartSuccess.style.display = "block";
    cartSuccess.innerHTML = `
      <div class="order-success">
        <div class="big-check">&#10003;</div>
        <h3>Order request sent</h3>
        <p>Thanks, ${escapeHtml(order.customerName)}. We'll call you to confirm and take payment when it's ready, around ${escapeHtml(order.pickupTime)}.</p>
        <div style="text-align:left;margin-top:16px;">
          ${order.items.map((i) => `<div style="display:flex;justify-content:space-between;font-size:.9rem;padding:4px 0;"><span>${i.qty} &times; ${escapeHtml(i.name)}</span><span>$${(i.qty * i.price).toFixed(2)}</span></div>`).join("")}
          <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:10px;padding-top:10px;border-top:1px solid var(--line);"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
        </div>
      </div>`;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector("[data-order-msg]");
      const items = Cart.get();
      if (!items.length) {
        msg.textContent = "Your cart is empty.";
        msg.className = "form-msg err";
        return;
      }
      const payload = {
        items: items.map((i) => ({ menuId: i.menuId, qty: i.qty })),
        customerName: form.querySelector("[name=customerName]").value.trim(),
        phone: form.querySelector("[name=phone]").value.trim(),
        pickupTime: form.querySelector("[name=pickupTime]").value.trim(),
        notes: form.querySelector("[name=notes]").value.trim()
      };
      if (!payload.customerName || !payload.phone) {
        msg.textContent = "Name and phone are required.";
        msg.className = "form-msg err";
        return;
      }
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Sending...";
      try {
        const order = await Api.post("/api/orders", payload);
        Cart.clear();
        showSuccess(order);
      } catch (err) {
        msg.textContent = err.message || "Could not submit your order.";
        msg.className = "form-msg err";
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "Submit order request";
      }
    });
  }
})();
