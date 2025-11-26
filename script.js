// script.js
// - Cart logic + Formspree wiring
// - GSAP animations + AOS initialization
// - Parallax mouse effect for hero illustration

// ---------- Utilities & Year ----------
document.addEventListener("DOMContentLoaded", () => {
  ["year","year2","year3"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = new Date().getFullYear();
  });

  // AOS init (scroll animations)
  if (window.AOS) AOS.init({ duration: 700, once: true, offset: 120 });

  // GSAP animations init
  initHeroAnimations();

  // render products if page has the grid
  if (document.getElementById("productsGrid")) renderProducts();

  // cart state
  loadCartFromStorage();
  updateCartCount();
  renderCartSummary();

  // forms
  enhanceAppointmentForm();
  enhanceCheckoutForm();

  // cart modal events
  document.getElementById("viewCartBtn")?.addEventListener("click", showCartModal);
  document.getElementById("closeCart")?.addEventListener("click", hideCartModal);
  document.getElementById("clearCart")?.addEventListener("click", clearCart);
  document.getElementById("checkoutNow")?.addEventListener("click", () => {
    hideCartModal();
    document.getElementById("checkoutArea")?.scrollIntoView({ behavior: "smooth" });
  });
});

// ---------- HERO / ANIMATIONS ----------
function initHeroAnimations() {
  if (!window.gsap) return;

  // subtle float on illustration
  gsap.to("#heroIllustration", { y: -8, repeat: -1, yoyo: true, ease: "sine.inOut", duration: 4 });

  // float icons with staggered timing
  gsap.to(".icon-1", { y: -12, x: -6, rotation: -6, repeat: -1, yoyo: true, duration: 4.2, ease: "sine.inOut" });
  gsap.to(".icon-2", { y: -8, x: 6, rotation: 6, repeat: -1, yoyo: true, duration: 3.8, ease: "sine.inOut", delay: 0.3 });
  gsap.to(".icon-3", { y: -14, x: 6, rotation: -4, repeat: -1, yoyo: true, duration: 4.6, ease: "sine.inOut", delay: 0.6 });

  // parallax on mouse move for 3D feel (if desktop)
  const hero = document.getElementById("hero3d");
  if (!hero) return;
  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to("#heroIllustration", { rotationY: px * 8, rotationX: -py * 8, transformPerspective: 900, transformOrigin: "center", duration: 0.6, ease: "power3.out" });
    gsap.to(".float-icon", { x: px * -12, y: py * -8, duration: 0.8, ease: "power3.out" });
  });
  hero.addEventListener("mouseleave", () => {
    gsap.to("#heroIllustration", { rotationY: 0, rotationX: 0, duration: 0.8, ease: "power3.out" });
    gsap.to(".float-icon", { x: 0, y: 0, duration: 0.8, ease: "power3.out" });
  });
}

// ---------- PRODUCTS (same demo products) ----------
const PRODUCTS = [
  { id: 1, name: "Herbal Tonic", desc: "Immunity booster tonic - 200ml", price: 150, img: "assets/prod1.jpg" },
  { id: 2, name: "Joint Care Capsules", desc: "Relieves joint pain - 60 caps", price: 499, img: "assets/prod2.jpg" },
  { id: 3, name: "Cough Syrup", desc: "Soothing syrup - 100ml", price: 120, img: "assets/prod3.jpg" },
  { id: 4, name: "Vitamin D Tablets", desc: "60 tablets", price: 299, img: "assets/prod4.jpg" },
  { id: 5, name: "Antiseptic Gel", desc: "Hand sanitizer - 250ml", price: 80, img: "assets/prod5.jpg" },
  { id: 6, name: "First Aid Kit", desc: "Essential home kit", price: 799, img: "assets/prod6.jpg" }
];

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  grid.innerHTML = "";
  PRODUCTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card card";
    card.setAttribute("data-aos", "fade-up");
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="muted">${p.desc}</p>
      <div class="product-footer">
        <strong>₹${p.price}</strong>
        <button class="btn" data-id="${p.id}">Add to cart</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // attach add-to-cart events
  document.querySelectorAll(".product-card .btn").forEach(btn => {
    btn.addEventListener("click", (ev) => {
      const id = Number(ev.currentTarget.getAttribute("data-id"));
      addToCart(id);
      // small feedback
      gsap.fromTo(ev.currentTarget, { scale: 1 }, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1 });
    });
  });
}

// ---------- CART LOGIC ----------
let cart = [];
function loadCartFromStorage() {
  try { cart = JSON.parse(localStorage.getItem("vanthu_cart")) || []; } catch { cart = []; }
}
function saveCartToStorage() { localStorage.setItem("vanthu_cart", JSON.stringify(cart)); }
function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const found = cart.find(x => x.id === id);
  if (found) found.qty++;
  else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  saveCartToStorage();
  updateCartCount();
  renderCartList();
  renderCartSummary();
}
function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  saveCartToStorage();
  updateCartCount();
  renderCartList();
  renderCartSummary();
}
function changeQty(id, qty) {
  const it = cart.find(x => x.id === id);
  if (!it) return;
  it.qty = Math.max(1, parseInt(qty) || 1);
  saveCartToStorage();
  renderCartList();
  renderCartSummary();
  updateCartCount();
}
function clearCart() {
  cart = [];
  saveCartToStorage();
  updateCartCount();
  renderCartList();
  renderCartSummary();
}
function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}
function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cart.reduce((s, i) => s + i.qty, 0);
}

// CART UI
function renderCartList() {
  const list = document.getElementById("cartList");
  if (!list) return;
  if (cart.length === 0) { list.innerHTML = "<p>Your cart is empty</p>"; return; }
  list.innerHTML = "";
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <div class="muted">₹${item.price} x 
          <input type="number" value="${item.qty}" min="1" data-id="${item.id}">
        </div>
      </div>
      <button class="btn-outline remove-btn" data-id="${item.id}">Remove</button>
    `;
    list.appendChild(row);
  });
  list.innerHTML += `<strong>Total: ₹${cartTotal()}</strong>`;

  // attach listeners for qty and remove
  list.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", (e) => {
      changeQty(Number(e.target.getAttribute("data-id")), e.target.value);
    });
  });
  list.querySelectorAll(".remove-btn").forEach(b => {
    b.addEventListener("click", (e) => removeFromCart(Number(e.currentTarget.getAttribute("data-id"))));
  });
}

function renderCartSummary() {
  const sum = document.getElementById("cartSummary");
  if (!sum) return;
  if (cart.length === 0) { sum.innerHTML = "<p class='muted'>Cart is empty</p>"; return; }
  sum.innerHTML = `
    <p>${cart.length} item(s) • Total: ₹${cartTotal()}</p>
    <ul class="muted">${cart.map(i => `<li>${i.name} x ${i.qty} — ₹${i.price * i.qty}</li>`).join("")}</ul>
  `;
}

function showCartModal() {
  renderCartList();
  const modal = document.getElementById("cartModal");
  if (modal) modal.style.display = "flex";
}
function hideCartModal() {
  const modal = document.getElementById("cartModal");
  if (modal) modal.style.display = "none";
}

// ---------- FORMSPREE HELPERS ----------
// Appointment: show sending indicator + set _replyto from email field so Formspree uses it
function enhanceAppointmentForm() {
  const form = document.getElementById("appointmentForm");
  if (!form) return;
  form.addEventListener("submit", () => {
    const msg = document.getElementById("apptResponse");
    if (msg) { msg.style.color = "black"; msg.textContent = "Sending..."; }

    // copy email to hidden _replyto for proper email threading
    const emailFld = form.querySelector("input[name='email']");
    const replyField = document.getElementById("apptReplyToField");
    if (emailFld && replyField) replyField.value = emailFld.value;
    // Let Formspree handle the POST (native submit)
  });
}

// Checkout: prepare orderItemsField (list) before submit
function enhanceCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    const orderField = document.getElementById("orderItemsField");
    if (orderField) {
      orderField.value = cart.length ? cart.map(i => `${i.name} (x${i.qty}) — ₹${i.price * i.qty}`).join("\n") + `\n\nTotal: ₹${cartTotal()}` : "No items";
    }
    const msg = document.getElementById("orderResponse");
    if (msg) msg.textContent = "Sending...";

    // After native submission, Formspree will take over.
    // We don't call e.preventDefault() because we want native POST to Formspree.
  });
}
