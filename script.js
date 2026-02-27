import { menuConfig } from "./menuConfig.js";

let cart = [];
let currentLang = "en";

/* ================= DYNAMIC IMAGE & PRICE ================= */

function handleChange(productKey, imageId, priceId, piecesId = null) {

  const config = menuConfig[productKey];
  if (!config) return;

  const parent = document.getElementById(imageId).parentElement;
  const selects = parent.querySelectorAll("select");

  const flavor = selects.length > 0 ? selects[0].value : null;

  if (flavor && config.images) {
    document.getElementById(imageId).src =
      "images/" + config.images[flavor];
  }

  let price;

  if (config.prices && piecesId) {
    const pieces = document.getElementById(piecesId).value;
    price = config.prices[pieces];
  } else {
    price = config.price;
  }

  if (priceId) {
    document.getElementById(priceId).innerText = "₾" + price;
  }
}

/* ================= ADD DYNAMIC ITEM ================= */

function addDynamicItem(productKey, imageId, piecesId = null) {

  const config = menuConfig[productKey];
  if (!config) return;

  const parent = document.getElementById(imageId).parentElement;
  const selects = parent.querySelectorAll("select");

  const flavor = selects.length > 0 ? selects[0].value : null;
  const pieces = piecesId ? document.getElementById(piecesId).value : null;

  let price;

  if (config.prices && pieces) {
    price = config.prices[pieces];
  } else {
    price = config.price;
  }

  let name_en = config.name_en || productKey;
  let name_ka = config.name_ka || productKey;

  if (flavor) {
    name_en += " - " + flavor;
    name_ka += " - " + flavor;
  }

  if (pieces) {
    name_en += ` (${pieces} pcs)`;
    name_ka += ` (${pieces} ცალი)`;
  }

  const existing = cart.find(item => item.name_en === name_en);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      name_en,
      name_ka,
      price,
      qty: 1
    });
  }

  renderCart();
}

/* ================= ADD FIXED ITEM ================= */

function addFixedItem(productKey, name_en, name_ka) {

  const config = menuConfig[productKey];
  if (!config) return;

  const existing = cart.find(item => item.name_en === name_en);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      name_en,
      name_ka,
      price: config.price,
      qty: 1
    });
  }

  renderCart();
}

function removeItem(name_en) {
  cart = cart.filter(item => item.name_en !== name_en);
  renderCart();
}

function decreaseQty(name_en) {
  const item = cart.find(item => item.name_en === name_en);
  if (!item) return;

  item.qty--;

  if (item.qty <= 0) {
    removeItem(name_en);
  } else {
    renderCart();
  }
}

function increaseQty(name_en) {
  const item = cart.find(item => item.name_en === name_en);
  if (!item) return;

  item.qty++;
  renderCart();
}

/* ================= RENDER CART ================= */

function renderCart() {

  const cartDiv = document.getElementById("cartItems");
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartCountEl = document.getElementById("cartCount");

  if (totalItems > 0) {
    cartCountEl.style.display = "inline-block";
    cartCountEl.innerText = totalItems;
  } else {
    cartCountEl.style.display = "none";
  }
  cartDiv.innerHTML = "";

  let total = 0;

  cart.forEach(item => {

    const name =
      currentLang === "en"
        ? item.name_en
        : item.name_ka;

    total += item.price * item.qty;

    cartDiv.innerHTML += `
  <div class="cart-item">
    <p>${name} x${item.qty} — ₾${item.price * item.qty}</p>
    
    <div class="cart-controls">
      <button onclick="decreaseQty('${item.name_en}')">−</button>
      <button onclick="increaseQty('${item.name_en}')">+</button>
      <button onclick="removeItem('${item.name_en}')">Remove</button>
    </div>
  </div>
`;
  });

  document.getElementById("total").innerText = total;
}

function calculateTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/* ================= ORDER TYPE PLACEHOLDER ================= */

window.addEventListener("DOMContentLoaded", () => {

  const orderTypeSelect = document.getElementById("orderType");
  const paymentMethodSelect = document.getElementById("paymentMethod");
  const addressInput = document.getElementById("address");
  const deliveryNote = document.getElementById("deliveryNote");

  function updatePaymentOptions() {

  const orderType = orderTypeSelect.value;

  if (orderType === "pickup") {

    addressInput.placeholder =
      currentLang === "en"
        ? "Type 'Pickup' or branch name"
        : "ჩაწერეთ 'Pickup' ან ფილიალი";

    paymentMethodSelect.innerHTML = `
      <option value="cash">Cash</option>
      <option value="card">Card</option>
    `;

    // Remove delivery message
    deliveryNote.innerText = "";
  }

  else if (orderType === "delivery") {

    addressInput.placeholder =
      currentLang === "en"
        ? "Enter full delivery address"
        : "შეიყვანეთ სრული მისამართი";

    paymentMethodSelect.innerHTML = `
      <option value="transfer">Bank Transfer</option>
    `;

    // Show delivery message
    deliveryNote.innerText =
      currentLang === "en"
        ? "Delivery fee not included"
        : "მიწოდების საფასური არ შედის";
  }
}

  orderTypeSelect.addEventListener("change", updatePaymentOptions);

  // Trigger once on page load
  updatePaymentOptions();

});/* ================= PLACE ORDER ================= */

function placeOrder() {

  if (cart.length === 0) {
    alert(currentLang === "en" ? "Cart is empty" : "კალათა ცარიელია");
    return;
  }

  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;
  const orderType = document.getElementById("orderType").value;
  const payment = document.getElementById("paymentMethod").value;

  sendOrderToWhatsApp(name, phone, address, orderType, payment);
}

/* ================= WHATSAPP ================= */

function sendOrderToWhatsApp(name, phone, address, orderType, payment) {

  const phoneNumber = "995501002006";

  let message =
    currentLang === "en"
      ? "Hello, I want to order:\n\n"
      : "გამარჯობა, მინდა შეკვეთა:\n\n";

  cart.forEach(item => {
    const itemName =
      currentLang === "en"
        ? item.name_en
        : item.name_ka;

    message += `• ${itemName} x${item.qty} — ₾${item.price * item.qty}\n`;
  });

  message += `\n💰 Total: ₾${calculateTotal()}\n\n`;
  message += `👤 Name: ${name}\n`;
  message += `📞 Phone: ${phone}\n`;
  message += `📦 Order Type: ${orderType}\n`;

  if (orderType === "delivery") {
    message += `🏠 Address: ${address}\n`;
  }

  message += `💳 Payment: ${payment}\n`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL =
    `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  window.open(whatsappURL, "_blank");
}

/* ================= LANGUAGE SWITCH ================= */

function setLang(lang) {

  currentLang = lang;

  document.querySelectorAll("[data-en]").forEach(element => {
    element.innerText = element.getAttribute(`data-${lang}`);
  });

  document.querySelectorAll("option").forEach(option => {
    if (option.getAttribute(`data-${lang}`)) {
      option.textContent =
        option.getAttribute(`data-${lang}`);
    }
  });

  renderCart();
}

function toggleCart() {
  document.getElementById("cartSidebar").classList.toggle("active");
}

/* ================= EXPORT TO WINDOW ================= */

window.handleChange = handleChange;
window.addDynamicItem = addDynamicItem;
window.addFixedItem = addFixedItem;
window.placeOrder = placeOrder;
window.setLang = setLang;
window.removeItem = removeItem;
window.decreaseQty = decreaseQty;
window.increaseQty = increaseQty;
window.toggleCart = toggleCart;
