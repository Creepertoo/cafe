// Cart persisted to localStorage so it survives navigation between pages.
const Cart = (function () {
  const KEY = "upc_cart_v1";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }
  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cart:change", { detail: items }));
  }

  return {
    get() { return read(); },
    count() { return read().reduce((n, i) => n + i.qty, 0); },
    total() { return Math.round(read().reduce((s, i) => s + i.qty * i.price, 0) * 100) / 100; },
    add(item) {
      const items = read();
      const existing = items.find((i) => i.menuId === item.menuId);
      if (existing) existing.qty += 1;
      else items.push({ menuId: item.menuId, name: item.name, price: item.price, qty: 1 });
      save(items);
    },
    setQty(menuId, qty) {
      let items = read();
      if (qty <= 0) items = items.filter((i) => i.menuId !== menuId);
      else {
        const it = items.find((i) => i.menuId === menuId);
        if (it) it.qty = qty;
      }
      save(items);
    },
    remove(menuId) {
      save(read().filter((i) => i.menuId !== menuId));
    },
    clear() { save([]); }
  };
})();
